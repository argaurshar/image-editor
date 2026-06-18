// Client-side image helpers: load + downscale uploads so payloads stay small,
// and split data URLs into the parts the API expects.
"use client";

import type { EditorImage } from "./types";

const MAX_DIM = 1536; // longest edge sent to the model
const JPEG_QUALITY = 0.92;

/** Read a File, downscale it if large, and return a JPEG data URL. */
export async function fileToEditorImage(file: File): Promise<EditorImage> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
  if (scale >= 1 && file.type === "image/jpeg") {
    return { dataUrl, mimeType: "image/jpeg" };
  }

  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { dataUrl, mimeType: file.type || "image/png" };
  ctx.drawImage(img, 0, 0, w, h);
  const out = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  return { dataUrl: out, mimeType: "image/jpeg" };
}

/** Split a data URL into { base64, mimeType } for the JSON API body. */
export function splitDataUrl(dataUrl: string): {
  base64: string;
  mimeType: string;
} {
  const match = dataUrl.match(/^data:([^;]+);base64,([\s\S]*)$/);
  if (!match) return { base64: dataUrl, mimeType: "image/jpeg" };
  return { mimeType: match[1], base64: match[2] };
}

export function toDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the image."));
    img.src = src;
  });
}
