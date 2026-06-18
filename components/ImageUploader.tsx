"use client";

import { useCallback, useRef, useState } from "react";
import { fileToEditorImage } from "@/lib/image";
import type { EditorImage } from "@/lib/types";

export function ImageUploader({
  onImage,
  disabled,
}: {
  onImage: (image: EditorImage) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Please choose an image file.");
        return;
      }
      setError(null);
      try {
        const image = await fileToEditorImage(file);
        onImage(image);
      } catch {
        setError("Could not read that image. Try another file.");
      }
    },
    [onImage]
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " "))
            inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) handleFile(e.dataTransfer.files?.[0]);
        }}
        className={[
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center transition",
          dragging
            ? "border-slate-900 bg-slate-50"
            : "border-slate-300 bg-white hover:border-slate-400",
          disabled ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        <div className="text-4xl">🛋️</div>
        <div className="text-lg font-semibold text-slate-800">
          Upload an interior photo
        </div>
        <p className="max-w-sm text-sm text-slate-500">
          Drag &amp; drop a room image here, or click to browse. We&apos;ll turn
          it into an editable table of every element.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
