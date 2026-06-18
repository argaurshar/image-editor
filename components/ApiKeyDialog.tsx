"use client";

import { useState } from "react";

export function ApiKeyDialog({
  initialKey,
  onSave,
  onClear,
  onClose,
}: {
  initialKey: string;
  onSave: (key: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialKey);
  const [show, setShow] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900">
          Your Gemini API key
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          This app runs entirely in your browser. Your key is saved only on this
          device (localStorage) and sent directly to Google — never to us.
        </p>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <input
              type={show ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="AIza…"
              autoFocus
              spellCheck={false}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="shrink-0 rounded-md border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs font-medium text-sky-600 hover:underline"
          >
            Get a key from Google AI Studio →
          </a>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClear();
              onClose();
            }}
            className="text-sm font-medium text-slate-500 hover:text-red-600"
          >
            Clear key
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(value);
                onClose();
              }}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
