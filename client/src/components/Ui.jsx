export function Card({ children, className = '', ...props }) {
  return <section className={`card-surface animate-in ${className}`} {...props}>{children}</section>;
}

export function Pill({ children, className = '' }) {
  return <span className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${className}`}>{children}</span>;
}

export function Empty({ label }) {
  return <div className="animate-in rounded-lg border border-dashed border-slate-300 bg-white/50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-400">{label}</div>;
}

export function Loader() {
  return (
    <div className="grid min-h-72 place-items-center text-sm font-medium text-slate-500">
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
        Loading
      </div>
    </div>
  );
}
