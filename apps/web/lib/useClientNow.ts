"use client";

/**
 * useClientNow — a hydration-safe clock snapshot (Money Bag audit, 2026-09-11).
 *
 * Render-time `Date.now()` / `new Date().getHours()` is a React hydration
 * hazard: the server renders one value and the client hydrates with another
 * (any clock drift, or a boundary crossed between the two paints — "listed 5h
 * ago" vs "6h ago", NEW tag on/off, open/closed pill) → React throws
 * "Hydration failed… tree will be regenerated on the client" and the whole
 * subtree re-renders, losing the SSR benefit and flashing.
 *
 * Contract: returns `null` on the server AND on the first client paint, then a
 * stable timestamp after mount. Callers render a neutral fallback until then.
 * `intervalMs` re-snapshots (e.g. every minute for an open/closed pill) — the
 * value only ever changes in an effect, never between SSR and hydration.
 */
import { useEffect, useState } from "react";

export function useClientNow(intervalMs?: number): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    if (!intervalMs) return;
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
