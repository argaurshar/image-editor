"use client";

const STEPS = [
  { key: "upload", label: "Upload" },
  { key: "edit", label: "Edit table" },
  { key: "result", label: "Compare" },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];

export function Stepper({ active }: { active: StepKey }) {
  const activeIndex = STEPS.findIndex((s) => s.key === active);
  return (
    <ol className="flex items-center gap-2 text-sm">
      {STEPS.map((step, i) => {
        const state =
          i < activeIndex ? "done" : i === activeIndex ? "active" : "todo";
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              className={[
                "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                state === "active"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : state === "done"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300 bg-white text-slate-400",
              ].join(" ")}
            >
              {state === "done" ? "✓" : i + 1}
            </span>
            <span
              className={
                state === "todo"
                  ? "text-slate-400"
                  : "font-medium text-slate-800"
              }
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="mx-1 h-px w-8 bg-slate-300" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
