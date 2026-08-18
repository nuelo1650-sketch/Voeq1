import type { ActivityEvent } from "@voeq/data";

/**
 * Option A (founder, Slice 1): contour COMMUNICATES activity, never MANUFACTURES it.
 *
 * - Production (and the default dev path): returns []  ->  ZERO nodes.
 * - Dev verification ONLY: when explicitly requested via `?seed=1` in a non-production
 *   build, returns a SMALL, DETERMINISTIC, clearly-labeled fixture shaped exactly like
 *   the real ActivityEvent contract. This is to PROVE the mechanism, not to make the
 *   page "feel alive". It is NEVER bundled as production data and NEVER auto-falls-back.
 *
 * Rules enforced here (Doc 06 §2 / founder):
 *   - Never fall back to seed automatically.
 *   - Never bundle as production data.
 *   - Never make Landing appear alive when the repo returns no activity.
 *   - No fake geography (campusZone is a neutral key, never a map).
 */
export const DEV_SEED_FLAG = "seed";

/** Production-safe source: always empty. The contour then renders zero nodes. */
export function getActivityEvents(isDev: boolean, seedParam?: string | null): ActivityEvent[] {
  if (!isDev) return [];
  if (seedParam !== "1") return [];
  return DEV_SEED_FIXTURE;
}

/**
 * Deterministic dev-only fixture. Shapes match ActivityEvent exactly.
 * campusZone is a neutral key ("campus:default") — NOT a drawn place / coordinate.
 */
export const DEV_SEED_FIXTURE: ActivityEvent[] = [
  { id: "seed-1", type: "new-listing", campusZone: "campus:default", refId: "listing-7", ts: "2026-08-18T10:00:00Z" },
  { id: "seed-2", type: "vendor-open", campusZone: "campus:default", refId: "vendor-3", ts: "2026-08-18T09:30:00Z" },
];
