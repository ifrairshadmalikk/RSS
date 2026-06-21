export function compact(value) {
  return new Intl.NumberFormat('en', { notation: 'compact' }).format(value || 0);
}

export function dateTime(value) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function toneClass(sentiment) {
  if (sentiment === 'Positive') return 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300';
  if (sentiment === 'Negative') return 'bg-rose-500/12 text-rose-700 dark:text-rose-300';
  return 'bg-slate-500/12 text-slate-700 dark:text-slate-300';
}
