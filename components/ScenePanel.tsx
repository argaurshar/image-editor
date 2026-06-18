"use client";

import type { ColorInfo, RoomAnalysis } from "@/lib/types";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const safeHex = (hex: string) => (HEX_RE.test(hex) ? hex : "#cccccc");

export function ScenePanel({
  analysis,
  onChange,
}: {
  analysis: RoomAnalysis;
  onChange: (next: RoomAnalysis) => void;
}) {
  const set = (patch: Partial<RoomAnalysis>) =>
    onChange({ ...analysis, ...patch });

  const setPalette = (palette: ColorInfo[]) => set({ overall_color_palette: palette });

  const updateSwatch = (i: number, patch: Partial<ColorInfo>) =>
    setPalette(
      analysis.overall_color_palette.map((c, idx) =>
        idx === i ? { ...c, ...patch } : c
      )
    );

  const fieldCls =
    "w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-slate-400";

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Room type
          </span>
          <input
            className={fieldCls}
            value={analysis.room_type}
            onChange={(e) => set({ room_type: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Style
          </span>
          <input
            className={fieldCls}
            value={analysis.room_style}
            onChange={(e) => set({ room_style: e.target.value })}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Lighting
        </span>
        <input
          className={fieldCls}
          value={analysis.lighting.description}
          placeholder="e.g. warm natural light from the left window"
          onChange={(e) =>
            set({
              lighting: { ...analysis.lighting, description: e.target.value },
            })
          }
        />
      </label>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Color palette
          </span>
          <button
            type="button"
            onClick={() =>
              setPalette([
                ...analysis.overall_color_palette,
                { name: "new", hex: "#cccccc" },
              ])
            }
            className="text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            + add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.overall_color_palette.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-2"
            >
              <input
                type="color"
                value={safeHex(c.hex)}
                onChange={(e) => updateSwatch(i, { hex: e.target.value })}
                className="h-5 w-5 cursor-pointer rounded-full border border-slate-200 p-0"
              />
              <input
                value={c.name}
                onChange={(e) => updateSwatch(i, { name: e.target.value })}
                className="w-20 bg-transparent text-xs outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  setPalette(
                    analysis.overall_color_palette.filter((_, idx) => idx !== i)
                  )
                }
                className="text-slate-400 hover:text-red-600"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
          {analysis.overall_color_palette.length === 0 && (
            <span className="text-xs text-slate-400">No palette colors.</span>
          )}
        </div>
      </div>
    </div>
  );
}
