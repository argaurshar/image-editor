export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-600">
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      {label ? <span className="text-sm font-medium">{label}</span> : null}
    </div>
  );
}
