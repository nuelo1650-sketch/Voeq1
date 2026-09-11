/**
 * Deterministic date formatting (Money Bag hydration audit, 2026-09-11).
 *
 * `new Date(x).toLocaleDateString()` is a React hydration hazard in CLIENT
 * components that are server-rendered: the server's ICU locale (Vercel/Node)
 * and the user's browser locale can differ, so the two paints disagree and
 * React throws "Hydration failed… tree will be regenerated". React's own docs
 * list "Date formatting in a user's locale" as a top cause.
 *
 * These helpers format from UTC with a FIXED pattern — identical string on
 * server and client, no locale table, no timezone drift.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "12 Sep 2026" — stable across server/client. */
export function formatDateFixed(input: string | number | Date | null | undefined): string {
  const d = input instanceof Date ? input : new Date(input ?? NaN);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "12 Sep" — same pattern without the year (for recent items). */
export function formatDayMonthFixed(input: string | number | Date | null | undefined): string {
  const d = input instanceof Date ? input : new Date(input ?? NaN);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
