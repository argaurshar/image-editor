// Client-side Gemini calls (bring-your-own-key).
//
// This app is a fully static site (GitHub Pages), so there is no server to hold
// a secret key. Each user supplies their OWN Gemini API key in the UI; it is
// stored only in their browser (localStorage) and sent directly to Google.
"use client";

import { GoogleGenAI, Modality } from "@google/genai";
import { ANALYSIS_PROMPT } from "./prompts";
import type {
  BoundingBox,
  ColorInfo,
  EditorImage,
  RoomAnalysis,
  RoomObject,
} from "./types";

export const ANALYZE_MODEL = "gemini-2.5-flash";
export const IMAGE_MODEL = "gemini-3-pro-image-preview";

function friendlyError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/api[_ ]?key|API_KEY|invalid|permission|401|403/i.test(msg)) {
    return new Error(
      "Your Gemini API key was rejected. Check that it's correct and that billing is enabled. " +
        `(${msg})`
    );
  }
  return new Error(msg);
}

/** Turn an interior photo into the structured, editable room analysis. */
export async function analyzeImage(
  apiKey: string,
  base64: string,
  mimeType: string
): Promise<RoomAnalysis> {
  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await ai.models.generateContent({
      model: ANALYZE_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: ANALYSIS_PROMPT },
          ],
        },
      ],
      config: { responseMimeType: "application/json", temperature: 0.2 },
    });
    return normalizeAnalysis(parseJsonLoose(res.text ?? ""));
  } catch (err) {
    throw friendlyError(err);
  }
}

/** Edit/regenerate the room photo from a natural-language instruction. */
export async function generateImage(
  apiKey: string,
  base64: string,
  mimeType: string,
  instruction: string
): Promise<EditorImage> {
  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: instruction },
          ],
        },
      ],
      config: { responseModalities: [Modality.IMAGE] },
    });
    const parts = res.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mt = part.inlineData.mimeType || "image/png";
        return {
          dataUrl: `data:${mt};base64,${part.inlineData.data}`,
          mimeType: mt,
        };
      }
    }
    const said = res.text ? ` Model response: ${res.text}` : "";
    throw new Error(`The image model did not return an image.${said}`);
  } catch (err) {
    throw friendlyError(err);
  }
}

// ---------------------------------------------------------------------------
// Parsing / normalization helpers
// ---------------------------------------------------------------------------

/** Parse JSON even if the model wrapped it in ```json fences or added prose. */
function parseJsonLoose(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced) {
      try {
        return JSON.parse(fenced[1]);
      } catch {
        /* fall through */
      }
    }
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first !== -1 && last > first) {
      return JSON.parse(trimmed.slice(first, last + 1));
    }
    throw new Error("Could not parse the model's JSON response.");
  }
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : v == null ? fallback : String(v);
}

function num(v: unknown, fallback = 1): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
}

function toColor(v: unknown): ColorInfo {
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return { name: str(o.name), hex: str(o.hex) };
  }
  return { name: str(v), hex: "" };
}

function toBox(v: unknown): BoundingBox {
  if (Array.isArray(v) && v.length === 4) {
    return [num(v[0], 0), num(v[1], 0), num(v[2], 0), num(v[3], 0)];
  }
  return [0, 0, 0, 0];
}

/** Coerce arbitrary model output into a well-formed RoomAnalysis. */
export function normalizeAnalysis(raw: unknown): RoomAnalysis {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;

  const palette = Array.isArray(o.overall_color_palette)
    ? o.overall_color_palette.map(toColor)
    : [];

  const lightingRaw = (o.lighting && typeof o.lighting === "object"
    ? o.lighting
    : {}) as Record<string, unknown>;

  const seen = new Set<string>();
  const objectsRaw = Array.isArray(o.objects) ? o.objects : [];
  const objects: RoomObject[] = objectsRaw.map((item, i) => {
    const obj = (item && typeof item === "object" ? item : {}) as Record<
      string,
      unknown
    >;
    let id = str(obj.id).trim();
    if (!id || seen.has(id)) {
      const base = id || slugify(str(obj.name) || `object-${i + 1}`);
      id = base;
      let n = 2;
      while (seen.has(id)) id = `${base}-${n++}`;
    }
    seen.add(id);
    return {
      id,
      name: str(obj.name, "Unknown element"),
      category: str(obj.category, "other"),
      color: toColor(obj.color),
      material: str(obj.material),
      finish: str(obj.finish),
      quantity: Math.max(1, Math.round(num(obj.quantity, 1))),
      location: str(obj.location ?? obj.position_in_room),
      bounding_box: toBox(obj.bounding_box),
      notes: str(obj.notes),
    };
  });

  return {
    room_type: str(o.room_type, "room"),
    room_style: str(o.room_style),
    overall_color_palette: palette,
    lighting: {
      type: str(lightingRaw.type, "mixed"),
      warmth: str(lightingRaw.warmth, "neutral"),
      description: str(lightingRaw.description),
    },
    objects,
  };
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "object"
  );
}
