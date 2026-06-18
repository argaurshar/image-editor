// Turns the user's table edits into a precise, STRUCTURED (JSON) instruction for
// the image model by diffing the edited analysis against the original one.
//
// The image model is sent a JSON object that lists exactly which fields changed
// (from -> to) for each element, plus a strict directive to change ONLY those
// and keep everything else identical. This gives far more precise edits than a
// loose natural-language sentence.

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

/** Drop empty/whitespace values from an object. */
function clean(obj: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) if (v && v.trim()) out[k] = v.trim();
  return out;
}

type FieldChange = { from: string; to: string };

interface ObjectEdit {
  action: "modify" | "add" | "remove";
  element: string;
  location?: string;
  changes?: Record<string, FieldChange>;
  spec?: Record<string, string>;
}

export interface EditPlan {
  /** Human-readable bullets for the UI. */
  changes: string[];
  /** The structured edit object (also what gets serialized and sent). */
  editJson: unknown;
  /** JSON string actually sent to the image model. */
  instruction: string;
  hasChanges: boolean;
}

export function buildEditPlan(
  baseline: RoomAnalysis,
  current: RoomAnalysis,
  extraInstructions: string
): EditPlan {
  const bullets: string[] = [];
  const objectEdits: ObjectEdit[] = [];
  const sceneChanges: Record<string, FieldChange> = {};

  // ---- scene-level ----
  if (norm(baseline.room_style) !== norm(current.room_style) && current.room_style) {
    sceneChanges.room_style = { from: baseline.room_style, to: current.room_style };
    bullets.push(`Overall style → ${current.room_style}.`);
  }
  if (
    norm(baseline.lighting?.description) !== norm(current.lighting?.description) &&
    current.lighting?.description
  ) {
    sceneChanges.lighting = {
      from: baseline.lighting?.description || "",
      to: current.lighting.description,
    };
    bullets.push(`Lighting → ${current.lighting.description}.`);
  }

  const baseById = new Map(baseline.objects.map((o) => [o.id, o]));
  const curById = new Map(current.objects.map((o) => [o.id, o]));

  // ---- removed ----
  for (const b of baseline.objects) {
    if (!curById.has(b.id)) {
      objectEdits.push({
        action: "remove",
        element: b.name,
        location: b.location || undefined,
      });
      bullets.push(`Remove the ${describe(b)}${b.location ? ` (${b.location})` : ""}.`);
    }
  }

  // ---- added / modified ----
  for (const c of current.objects) {
    const b = baseById.get(c.id);

    if (!b) {
      objectEdits.push({
        action: "add",
        element: c.name,
        location: c.location || undefined,
        spec: clean({
          color: colorStr(c.color),
          material: c.material,
          finish: c.finish,
          quantity: c.quantity > 1 ? String(c.quantity) : "",
        }),
      });
      bullets.push(`Add a ${describe(c)}${c.location ? ` at ${c.location}` : ""}.`);
      continue;
    }

    const fieldChanges: Record<string, FieldChange> = {};
    if (norm(b.name) !== norm(c.name)) {
      fieldChanges.type = { from: b.name, to: c.name };
    }
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
      objectEdits.push({
        action: "modify",
        element: b.name,
        location: b.location || undefined,
        changes: fieldChanges,
      });
      const parts = Object.entries(fieldChanges).map(([k, v]) => `${k}: ${v.to}`);
      bullets.push(`${b.name}${b.location ? ` (${b.location})` : ""} → ${parts.join(", ")}.`);
    }
  }

  const extra = extraInstructions.trim();
  if (extra) bullets.push(extra);

  const editJson = {
    task: "edit_image",
    instruction:
      "Edit the provided interior photograph by applying ONLY the edits listed " +
      "below. Preserve everything else EXACTLY as in the original: same camera " +
      "angle, framing, perspective, walls, floor, ceiling, windows, room layout, " +
      "lighting and shadows, and every object that is not listed. Do not " +
      "re-render, restyle, or move anything that is not in the edits. The result " +
      "must be photorealistic and seamless.",
    ...(Object.keys(sceneChanges).length ? { scene_changes: sceneChanges } : {}),
    object_edits: objectEdits,
    ...(extra ? { additional_instructions: extra } : {}),
    preserve:
      "Everything not explicitly listed in scene_changes, object_edits or " +
      "additional_instructions must stay pixel-faithful to the original image.",
  };

  const hasChanges =
    objectEdits.length > 0 || Object.keys(sceneChanges).length > 0 || !!extra;

  return {
    changes: bullets,
    editJson,
    instruction: JSON.stringify(editJson, null, 2),
    hasChanges,
  };
}
