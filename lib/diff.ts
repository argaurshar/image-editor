// Turns the user's table edits into a sequence of FOCUSED, single-change JSON
// instructions for the image model.
//
// Image models reliably apply one localized change per pass but tend to skip
// some when many edits are requested at once. So we diff the edited analysis
// against the original and emit ONE step per changed element / scene attribute.
// page.tsx applies them sequentially (chaining each result into the next), which
// makes every change land while keeping everything else faithful.

import type { ColorInfo, RoomAnalysis, RoomObject } from "./types";

function norm(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function colorStr(c: ColorInfo | undefined): string {
  return [c?.name, c?.hex].map((p) => (p ?? "").trim()).filter(Boolean).join(" ");
}

function colorChanged(a: ColorInfo | undefined, b: ColorInfo | undefined): boolean {
  return norm(a?.name) !== norm(b?.name) || norm(a?.hex) !== norm(b?.hex);
}

function describe(o: RoomObject): string {
  return [o.color?.name, o.finish, o.material, o.name]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

/** The element's bounding box, only if it's a real (non-empty) region. */
function region(o: RoomObject): number[] | undefined {
  const b = o.bounding_box;
  if (!Array.isArray(b) || b.length !== 4) return undefined;
  const [ymin, xmin, ymax, xmax] = b;
  return ymax - ymin > 0 && xmax - xmin > 0 ? b : undefined;
}

function clean(obj: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) if (v && v.trim()) out[k] = v.trim();
  return out;
}

type FieldChange = { from: string; to: string };

/** One focused edit sent to the image model as its own pass. */
export interface EditStep {
  /** Short human label for the UI / progress. */
  label: string;
  /** JSON instruction for this single change. */
  instruction: string;
}

export interface EditPlan {
  /** Human-readable bullets for the UI. */
  changes: string[];
  /** One focused step per change, applied sequentially. */
  steps: EditStep[];
  hasChanges: boolean;
}

const PRESERVE =
  "Keep the camera angle, framing, perspective, walls, floor, ceiling, " +
  "windows, room layout, lighting and shadows, and every other object EXACTLY " +
  "the same as the input image. Change nothing except what `edit` specifies. " +
  "The result must be photorealistic and seamless.";

function stepInstruction(edit: Record<string, unknown>): string {
  return JSON.stringify(
    {
      task: "edit_image",
      instruction:
        "Edit the provided interior photograph to apply ONLY the single change " +
        "described in `edit`. Identify the target element using `element`, its " +
        "`currently` appearance, its `location`, and `region` — a bounding box " +
        "[ymin, xmin, ymax, xmax] normalized to 0-1000 (top-left origin) marking " +
        "exactly where the element is. Apply the change so it is clearly and " +
        "unambiguously visible in the result. If `edit.keep_shape` is true, change " +
        "ONLY the element's surface appearance (its color, material and/or finish) " +
        "and preserve its EXACT shape, silhouette, proportions, size and position " +
        "— do not redraw, reshape, restyle, resize, or replace the object's form. " +
        PRESERVE,
      edit,
      preserve:
        "Everything except the single edit above must stay pixel-faithful to " +
        "the input image.",
    },
    null,
    2
  );
}

export function buildEditPlan(
  baseline: RoomAnalysis,
  current: RoomAnalysis,
  extraInstructions: string
): EditPlan {
  const bullets: string[] = [];
  const sceneSteps: EditStep[] = [];
  const objectSteps: EditStep[] = [];
  const extraSteps: EditStep[] = [];

  // ---- scene-level (broad) ----
  if (norm(baseline.room_style) !== norm(current.room_style) && current.room_style) {
    bullets.push(`Overall style → ${current.room_style}.`);
    sceneSteps.push({
      label: `Style → ${current.room_style}`,
      instruction: stepInstruction({
        action: "restyle_room",
        to: current.room_style,
        from: baseline.room_style || undefined,
      }),
    });
  }
  if (
    norm(baseline.lighting?.description) !== norm(current.lighting?.description) &&
    current.lighting?.description
  ) {
    bullets.push(`Lighting → ${current.lighting.description}.`);
    sceneSteps.push({
      label: `Lighting → ${current.lighting.description}`,
      instruction: stepInstruction({
        action: "adjust_lighting",
        to: current.lighting.description,
      }),
    });
  }

  const baseById = new Map(baseline.objects.map((o) => [o.id, o]));
  const curById = new Map(current.objects.map((o) => [o.id, o]));

  // ---- removed ----
  for (const b of baseline.objects) {
    if (!curById.has(b.id)) {
      bullets.push(`Remove the ${describe(b)}${b.location ? ` (${b.location})` : ""}.`);
      objectSteps.push({
        label: `Remove ${b.name}`,
        instruction: stepInstruction({
          action: "remove",
          element: b.name,
          currently: describe(b) || undefined,
          location: b.location || undefined,
          region: region(b),
        }),
      });
    }
  }

  // ---- added / modified ----
  for (const c of current.objects) {
    const b = baseById.get(c.id);

    if (!b) {
      bullets.push(`Add a ${describe(c)}${c.location ? ` at ${c.location}` : ""}.`);
      objectSteps.push({
        label: `Add ${c.name}`,
        instruction: stepInstruction({
          action: "add",
          element: c.name,
          location: c.location || undefined,
          spec: clean({
            color: colorStr(c.color),
            material: c.material,
            finish: c.finish,
            quantity: c.quantity > 1 ? String(c.quantity) : "",
          }),
        }),
      });
      continue;
    }

    const fieldChanges: Record<string, FieldChange> = {};
    if (norm(b.name) !== norm(c.name)) fieldChanges.type = { from: b.name, to: c.name };
    if (colorChanged(b.color, c.color) && (c.color?.name || c.color?.hex)) {
      fieldChanges.color = { from: colorStr(b.color), to: colorStr(c.color) };
    }
    if (norm(b.material) !== norm(c.material) && c.material) {
      fieldChanges.material = { from: b.material, to: c.material };
    }
    if (norm(b.finish) !== norm(c.finish) && c.finish) {
      fieldChanges.finish = { from: b.finish || "", to: c.finish };
    }
    if (b.quantity !== c.quantity) {
      fieldChanges.quantity = { from: String(b.quantity), to: String(c.quantity) };
    }
    if (norm(b.location) !== norm(c.location) && c.location) {
      fieldChanges.location = { from: b.location || "", to: c.location };
    }

    if (Object.keys(fieldChanges).length) {
      const parts = Object.entries(fieldChanges).map(([k, v]) => `${k}: ${v.to}`);
      bullets.push(`${b.name}${b.location ? ` (${b.location})` : ""} → ${parts.join(", ")}.`);
      // Surface-only edits (no object-type swap) must keep the exact form.
      const keepShape = !fieldChanges.type;
      objectSteps.push({
        label: `${b.name}: ${Object.entries(fieldChanges)
          .map(([k, v]) => `${k}→${v.to}`)
          .join(", ")}`,
        instruction: stepInstruction({
          action: "modify",
          element: b.name,
          currently: describe(b) || undefined,
          location: b.location || undefined,
          region: region(b),
          keep_shape: keepShape ? true : undefined,
          changes: fieldChanges,
        }),
      });
    }
  }

  // ---- free-text extra (applied last) ----
  const extra = extraInstructions.trim();
  if (extra) {
    bullets.push(extra);
    extraSteps.push({
      label: "Extra instructions",
      instruction: stepInstruction({ action: "custom", instruction: extra }),
    });
  }

  const steps = [...sceneSteps, ...objectSteps, ...extraSteps];

  return { changes: bullets, steps, hasChanges: steps.length > 0 };
}
