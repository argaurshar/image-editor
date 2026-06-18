"use client";

import type { RoomAnalysis, RoomObject } from "@/lib/types";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const CATEGORIES = [
  "furniture",
  "lighting",
  "decor",
  "textile",
  "flooring",
  "wall",
  "window",
  "plant",
  "other",
];

function safeHex(hex: string): string {
  return HEX_RE.test(hex) ? hex : "#cccccc";
}

export function ElementsTable({
  analysis,
  onChange,
  selectedId,
  onSelect,
}: {
  analysis: RoomAnalysis;
  onChange: (next: RoomAnalysis) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const objects = analysis.objects;

  const update = (id: string, patch: Partial<RoomObject>) => {
    onChange({
      ...analysis,
      objects: objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  };

  const updateColor = (id: string, patch: Partial<RoomObject["color"]>) => {
    onChange({
      ...analysis,
      objects: objects.map((o) =>
        o.id === id ? { ...o, color: { ...o.color, ...patch } } : o
      ),
    });
  };

  const remove = (id: string) => {
    onChange({ ...analysis, objects: objects.filter((o) => o.id !== id) });
    if (selectedId === id) onSelect(null);
  };

  const add = () => {
    const id = `custom-${Date.now().toString(36)}`;
    const fresh: RoomObject = {
      id,
      name: "New element",
      category: "furniture",
      color: { name: "", hex: "" },
      material: "",
      finish: "",
      quantity: 1,
      location: "",
      bounding_box: [350, 350, 650, 650],
      notes: "",
    };
    onChange({ ...analysis, objects: [...objects, fresh] });
    onSelect(id);
  };

  const inputCls =
    "w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm outline-none focus:border-slate-300 focus:bg-white";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-slate-700">
          Elements ({objects.length})
        </h3>
        <button
          type="button"
          onClick={add}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
        >
          + Add element
        </button>
      </div>

      <div className="max-h-[60vh] overflow-auto">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Element</th>
              <th className="px-3 py-2 font-semibold">Category</th>
              <th className="px-3 py-2 font-semibold">Color</th>
              <th className="px-3 py-2 font-semibold">Material</th>
              <th className="px-3 py-2 font-semibold">Finish</th>
              <th className="px-3 py-2 font-semibold">Qty</th>
              <th className="px-3 py-2 font-semibold">Location</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {objects.map((o) => {
              const active = o.id === selectedId;
              return (
                <tr
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  className={[
                    "border-t border-slate-100 align-top",
                    active ? "bg-emerald-50" : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <td className="px-2 py-1">
                    <input
                      className={inputCls + " font-medium text-slate-800"}
                      value={o.name}
                      onChange={(e) => update(o.id, { name: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className={inputCls}
                      list="category-options"
                      value={o.category}
                      onChange={(e) =>
                        update(o.id, { category: e.target.value })
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={safeHex(o.color.hex)}
                        onChange={(e) =>
                          updateColor(o.id, { hex: e.target.value })
                        }
                        className="h-6 w-6 shrink-0 cursor-pointer rounded border border-slate-200 bg-white p-0"
                        title={o.color.hex || "Pick color"}
                      />
                      <input
                        className={inputCls}
                        value={o.color.name}
                        placeholder="color name"
                        onChange={(e) =>
                          updateColor(o.id, { name: e.target.value })
                        }
                      />
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className={inputCls}
                      value={o.material}
                      onChange={(e) =>
                        update(o.id, { material: e.target.value })
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className={inputCls}
                      value={o.finish}
                      onChange={(e) => update(o.id, { finish: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={1}
                      className={inputCls + " w-14"}
                      value={o.quantity}
                      onChange={(e) =>
                        update(o.id, {
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className={inputCls}
                      value={o.location}
                      onChange={(e) =>
                        update(o.id, { location: e.target.value })
                      }
                    />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(o.id);
                      }}
                      title="Delete element"
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
            {objects.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-400">
                  No elements. Click &ldquo;Add element&rdquo; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <datalist id="category-options">
        {CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </div>
  );
}
