"use client";

import type { BoundingBox, EditorImage, RoomObject } from "@/lib/types";

function boxStyle(box: BoundingBox): React.CSSProperties | null {
  const [ymin, xmin, ymax, xmax] = box;
  const w = xmax - xmin;
  const h = ymax - ymin;
  if (w <= 0 || h <= 0) return null; // skip empty/invalid boxes
  return {
    top: `${ymin / 10}%`,
    left: `${xmin / 10}%`,
    width: `${w / 10}%`,
    height: `${h / 10}%`,
  };
}

export function ImageCanvas({
  image,
  objects,
  selectedId,
  onSelect,
  showAllBoxes,
}: {
  image: EditorImage;
  objects: RoomObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  showAllBoxes: boolean;
}) {
  return (
    <div className="relative inline-block max-w-full select-none align-top leading-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.dataUrl}
        alt="Room"
        className="block h-auto max-h-[70vh] w-auto max-w-full rounded-xl"
        onClick={() => onSelect(null)}
      />
      {objects.map((o) => {
        const style = boxStyle(o.bounding_box);
        if (!style) return null;
        const active = o.id === selectedId;
        const visible = active || showAllBoxes;
        return (
          <button
            key={o.id}
            type="button"
            style={style}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(active ? null : o.id);
            }}
            title={o.name}
            className={[
              "absolute rounded-md border-2 transition",
              active
                ? "z-20 border-emerald-400 bg-emerald-400/20 shadow-[0_0_0_2px_rgba(16,185,129,0.4)]"
                : visible
                  ? "z-10 border-sky-400/80 bg-sky-400/10 hover:bg-sky-400/20"
                  : "border-transparent hover:border-sky-300/70 hover:bg-sky-300/10",
            ].join(" ")}
          >
            {(active || showAllBoxes) && (
              <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-slate-900/85 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {o.name}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
