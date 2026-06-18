"use client";

import { useEffect, useRef, useState } from "react";
import { loadImage } from "@/lib/image";
import type { EditorImage } from "@/lib/types";

export function CompareSlider({
  before,
  after,
}: {
  before: EditorImage;
  after: EditorImage;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // % of the BEFORE image shown from the left
  const [ratio, setRatio] = useState(3 / 2);
  const dragging = useRef(false);

  // Match the wrapper's aspect ratio to the original image.
  useEffect(() => {
    let alive = true;
    loadImage(before.dataUrl).then((img) => {
      if (alive && img.width && img.height) setRatio(img.width / img.height);
    });
    return () => {
      alive = false;
    };
  }, [before.dataUrl]);

  const moveTo = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  };

  return (
    <div className="w-full">
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
        style={{ aspectRatio: String(ratio) }}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          moveTo(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && moveTo(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        {/* AFTER fills the whole area */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={after.dataUrl}
          alt="After"
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />
        {/* BEFORE clipped to the left portion */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before.dataUrl}
          alt="Before"
          className="absolute inset-0 h-full w-full object-contain"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          draggable={false}
        />

        <span className="absolute left-3 top-3 rounded bg-slate-900/75 px-2 py-0.5 text-xs font-medium text-white">
          Before
        </span>
        <span className="absolute right-3 top-3 rounded bg-emerald-600/85 px-2 py-0.5 text-xs font-medium text-white">
          After
        </span>

        {/* Divider + handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow"
          style={{ left: `${pos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-md">
            ⇄
          </div>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Compare before and after"
        className="mt-3 w-full accent-slate-900"
      />
    </div>
  );
}
