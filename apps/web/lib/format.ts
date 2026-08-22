/**
 * VS6.13 / VS6.17 — Time formatting helpers (client-safe, no deps).
 * Relative time for message bubbles; absolute for hover/title. Honest: derived
 * from real ISO timestamps only.
 */

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatAbsoluteTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** VS6.14 — Date separator label. Today / Yesterday / Mar 5 / Mar 5, 2025. */
export function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
}

/** VS6.16 — Honest last-seen text. Never "always active". */
export function formatLastSeen(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60000);
  if (min < 5) return "Active now";
  if (min < 60) return `Active ${min} minutes ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Active ${hr} hours ago`;
  const day = Math.floor(hr / 24);
  return `Last seen ${day} day${day === 1 ? "" : "s"} ago`;
}
