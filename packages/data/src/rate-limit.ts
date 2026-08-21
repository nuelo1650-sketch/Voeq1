/**
 * In-memory rate limiter (mock phase). Windowed count per key.
 * Phase 9: swap for Redis-backed limiter (Doc 13 §13.9) — same signature.
 *
 * Dev/test tooling (zero production impact):
 *  - `rateLimitStore.clear()` — dev only; clears buckets. Refuses in production.
 *  - `VOEQ_RATE_LIMIT_DISABLED=true` — dev only; disables enforcement so a full
 *    test suite can run without tripping the limit. NEVER honored in production.
 */
export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
  remaining: number;
}

interface Bucket {
  count: number;
  firstAt: number;
}

const buckets = new Map<string, Bucket>();

// Enforcement is ALWAYS on in production. In development it can be disabled via
// VOEQ_RATE_LIMIT_DISABLED=true (testing only). Corrected from the brief's
// inverted logic: brief wrote `NODE_ENV !== 'development' || disabled === 'true'`
// which would have DISABLED the limit in dev-without-env-var.
const ENFORCE_RATE_LIMIT =
  process.env.NODE_ENV === "production" ||
  process.env.VOEQ_RATE_LIMIT_DISABLED !== "true";

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (!ENFORCE_RATE_LIMIT) {
    return { allowed: true, retryAfterMs: 0, remaining: limit };
  }

  const now = Date.now();
  const b = buckets.get(key);

  if (!b || now - b.firstAt > windowMs) {
    buckets.set(key, { count: 1, firstAt: now });
    return { allowed: true, retryAfterMs: 0, remaining: limit - 1 };
  }

  if (b.count >= limit) {
    const retryAfterMs = Math.max(0, windowMs - (now - b.firstAt));
    return { allowed: false, retryAfterMs, remaining: 0 };
  }

  b.count += 1;
  return { allowed: true, retryAfterMs: 0, remaining: limit - b.count };
}

/** Dev/test-only handle to clear the in-memory store. Throws in production. */
export const rateLimitStore = {
  clear(): void {
    if (process.env.NODE_ENV === "production") {
      throw new Error("rateLimitStore.clear() called in production");
    }
    buckets.clear();
  },
};
