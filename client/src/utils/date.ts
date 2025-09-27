export function parseDateSafe(v: unknown): Date | null {
  if (v == null) return null;

  // numeric? (seconds vs ms)
  const n = Number(v);
  if (Number.isFinite(n)) {
    const ms = n < 1e12 ? n * 1000 : n; // if it looks like seconds, convert
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // string? (ISO or SQL DATETIME)
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(d: Date | null): string {
  if (!d) return "—";
  // tweak to your desired format
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}
