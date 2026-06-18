// Turns the user's table edits into a precise, natural-language instruction for
// the image model by diffing the edited analysis against the original one.

import type { RoomAnalysis, RoomObject } from "./types";

function norm(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function describe(o: RoomObject): string {
  return [o.color?.name, o.finish, o.material, o.name]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

export interface EditPlan {
  /** One human-readable sentence per change. */
  changes: string[];
  /** Full prompt sent to the image model. */
  instruction: string;
  hasChanges: boolean;
}

export function buildEditPlan(
  baseline: RoomAnalysis,
  current: RoomAnalysis,
  extraInstructions: string
): EditPlan {
  const changes: string[] = [];

  // Scene-level changes.
  if (norm(baseline.room_style) !== norm(current.room_style) && current.room_style) {
    changes.push(`Change the overall room style to ${current.room_style}.`);
  }
  if (
    norm(baseline.lighting?.description) !== norm(current.lighting?.description) &&
    current.lighting?.description
  ) {
    changes.push(`Adjust the lighting so it is ${current.lighting.description}.`);
  }

  const baseById = new Map(baseline.objects.map((o) => [o.id, o]));
  const curById = new Map(current.objects.map((o) => [o.id, o]));

  // Removed objects.
  for (const b of baseline.objects) {
    if (!curById.has(b.id)) {
      const where = b.location ? ` (${b.location})` : "";
      changes.push(`Remove the ${describe(b)}${where}.`);
    }
  }

  // Added or modified objects.
  for (const c of current.objects) {
    const b = baseById.get(c.id);
    if (!b) {
      const where = c.location ? ` at ${c.location}` : "";
      changes.push(`Add a ${describe(c)}${where}.`);
      continue;
    }

    const edits: string[] = [];
    if (norm(b.name) !== norm(c.name)) {
      edits.push(`replace it with a ${c.name}`);
    }
    if (norm(b.color?.name) !== norm(c.color?.name) && c.color?.name) {
      const hex = c.color?.hex ? ` (${c.color.hex})` : "";
      edits.push(`change its color to ${c.color.name}${hex}`);
    }
    if (norm(b.material) !== norm(c.material) && c.material) {
      edits.push(`change its material to ${c.material}`);
    }
    if (norm(b.finish) !== norm(c.finish) && c.finish) {
      edits.push(`change its finish to ${c.finish}`);
    }
    if (b.quantity !== c.quantity) {
      edits.push(`change the quantity to ${c.quantity}`);
    }
    if (edits.length) {
      const where = b.location ? ` at ${b.location}` : "";
      changes.push(`For the ${b.name}${where}: ${edits.join(", ")}.`);
    }
  }

  const extra = extraInstructions.trim();
  if (extra) changes.push(extra);

  const instruction = [
    "You are an expert interior-design photo editor. Edit the provided room",
    "photograph to apply ONLY the changes listed below. Keep the camera angle,",
    "perspective, room geometry, and every object that is not mentioned exactly",
    "the same. The result must be photorealistic and seamless.",
    "",
    "Changes to apply:",
    ...changes.map((c, i) => `${i + 1}. ${c}`),
  ].join("\n");

  return { changes, instruction, hasChanges: changes.length > 0 };
}
