"use client";

import type { ReactNode } from "react";
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

  // text-base (16px) on mobile inputs avoids iOS auto-zoom on focus.
  const tableInput =
    "w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm outline-none focus:border-slate-300 focus:bg-white";
  const cardInput =
    "w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-base outline-none focus:border-slate-500";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-slate-700">
          Elements ({objects.length})
        </h3>
        <button
          type="button"
          onClick={add}
          className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700"
        >
          + Add element
        </button>
      </div>

      {/* ------------------ Mobile / tablet: cards ------------------ */}
      <div className="space-y-3 p-3 lg:hidden">
        {objects.map((o) => {
          const active = o.id === selectedId;
          return (
            <div
              key={o.id}
              onClick={() => onSelect(o.id)}
              className={[
                "rounded-xl border p-3",
                active
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <div className="mb-2 flex items-center gap-2">
                <input
                  className={cardInput + " flex-1 font-semibold"}
                  value={o.name}
                  onChange={(e) => update(o.id, { name: e.target.value })}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(o.id);
                  }}
                  aria-label="Delete element"
                  className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5">
                <Field label="Color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={safeHex(o.color.hex)}
                      onChange={(e) => updateColor(o.id, { hex: e.target.value })}
                      className="h-9 w-11 shrink-0 cursor-pointer rounded border border-slate-200 bg-white p-0"
                      title={o.color.hex || "Pick color"}
                    />
                    <input
                      className={cardInput + " flex-1"}
                      value={o.color.name}
                      placeholder="color name"
                      onChange={(e) =>
                        updateColor(o.id, { name: e.target.value })
                      }
                    />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Material">
                    <input
                      className={cardInput}
                      value={o.material}
                      onChange={(e) => update(o.id, { material: e.target.value })}
                    />
                  </Field>
                  <Field label="Finish / texture">
                    <input
                      className={cardInput}
                      value={o.finish}
                      onChange={(e) => update(o.id, { finish: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Category">
                    <input
                      className={cardInput}
                      list="category-options"
                      value={o.category}
                      onChange={(e) => update(o.id, { category: e.target.value })}
                    />
                  </Field>
                  <Field label="Qty">
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      className={cardInput}
                      value={o.quantity}
                      onChange={(e) =>
                        update(o.id, {
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                    />
                  </Field>
                </div>

                <Field label="Location">
                  <input
                    className={cardInput}
                    value={o.location}
                    onChange={(e) => update(o.id, { location: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          );
        })}
        {objects.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">
            No elements. Tap &ldquo;Add element&rdquo; to create one.
          </p>
        )}
      </div>

      {/* ------------------ Desktop: table ------------------ */}
      <div className="hidden max-h-[60vh] overflow-auto lg:block">
        <table className="w-full min-w-[720px] border-collapse text-sm">
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
                      className={tableInput + " font-medium text-slate-800"}
                      value={o.name}
                      onChange={(e) => update(o.id, { name: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className={tableInput}
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
                        className={tableInput}
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
                      className={tableInput}
                      value={o.material}
                      onChange={(e) =>
                        update(o.id, { material: e.target.value })
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className={tableInput}
                      value={o.finish}
                      onChange={(e) => update(o.id, { finish: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={1}
                      className={tableInput + " w-14"}
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
                      className={tableInput}
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}
