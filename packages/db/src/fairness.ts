/** MONEY BAG A2 — the fairness algorithm, pure functions (unit-testable).
 *  Landing showcase score + Wilson smoothing + rotation cooldown + fair-share order.
 *  All functions PURE — no DB. The cron and queries call these.
 */

/** Wilson lower bound for a star rating (z=1.96, 95% confidence).
 *  ratingNormalized: 0..1 (stars/5). n: number of reviews.
 *  A 5.0 from 3 reviews scores ~0.43; a 4.9 from 300 scores ~0.85. */
export function ratingConfidence(stars: number, n: number): number {
  if (n <= 0) return 0;
  const z = 1.96;
  const phat = Math.max(0, Math.min(1, stars / 5));
  const denom = 1 + (z * z) / n;
  const centre = phat + (z * z) / (2 * n);
  const margin = z * Math.sqrt((phat * (1 - phat)) / n + (z * z) / (4 * n * n));
  return Math.max(0, (centre - margin) / denom);
}

/** Engagement score from 30d counts (normalized, capped). */
export function engagement30d(saves: number, follows: number, messages: number): number {
  const raw = saves * 3 + follows * 4 + messages * 2;
  return Math.min(1, raw / 500); // 500 weighted points = fully engaged
}

/** Freshness: exponential decay over 14 days from the last listing update. */
export function freshness(lastUpdateDaysAgo: number): number {
  if (lastUpdateDaysAgo < 0) return 0;
  if (lastUpdateDaysAgo > 14) return 0;
  return 1 - lastUpdateDaysAgo / 14;
}

/** Completeness: profile photo + >=3 listings + description + any socials. */
export function completeness(v: { photo: boolean; listings: number; description: boolean; socials: boolean }): number {
  let score = 0;
  if (v.photo) score += 0.3;
  if (v.listings >= 3) score += 0.3; else score += (v.listings / 3) * 0.3;
  if (v.description) score += 0.2;
  if (v.socials) score += 0.2;
  return score;
}

/** Full composite score (weights versioned in the snapshot row). */
export function vendorScore(v: {
  stars: number; reviewCount: number; saves: number; follows: number; messages: number;
  lastUpdateDaysAgo: number; photo: boolean; listings: number; description: boolean; socials: boolean;
}): { score: number; breakdown: Record<string, number> } {
  const breakdown = {
    ratingConfidence: ratingConfidence(v.stars, v.reviewCount),
    engagement30d: engagement30d(v.saves, v.follows, v.messages),
    freshness: freshness(v.lastUpdateDaysAgo),
    completeness: completeness({ photo: v.photo, listings: v.listings, description: v.description, socials: v.socials }),
  };
  const score =
    0.35 * breakdown.ratingConfidence +
    0.25 * breakdown.engagement30d +
    0.2 * breakdown.freshness +
    0.2 * breakdown.completeness;
  return { score, breakdown };
}

/** ROTATION GUARANTEE: is this vendor eligible for a showcase slot today?
 *  max 14 consecutive days, then 7 days cooldown. */
export function showcaseEligible(consecutiveDays: number, daysSinceLastShown: number): boolean {
  if (consecutiveDays < 14) return true;
  return daysSinceLastShown >= 7;
}

/** FAIR-SHARE ORDER: interleave listings round-robin by vendor so no two
 *  consecutive cards share a vendor, and every vendor cycles evenly.
 *  Input: listings grouped in vendor buckets (already quality-ordered inside each bucket).
 *  Output: flat order. Leftover listings append at the end when buckets exhaust unevenly. */
export function fairShareOrder(buckets: { vendorId: string; items: Array<{ id: string }> }[]): Array<{ id: string; vendorId: string }> {
  const queue = buckets.filter((b) => b.items.length > 0).map((b) => ({ ...b, next: 0 }));
  const out: Array<{ id: string; vendorId: string }> = [];
  while (queue.length > 0) {
    for (let i = 0; i < queue.length; i++) {
      const b = queue[i];
      if (b.next < b.items.length) {
        out.push({ id: b.items[b.next].id, vendorId: b.vendorId });
        b.next++;
      }
    }
    // drop exhausted buckets
    for (let i = queue.length - 1; i >= 0; i--) if (queue[i].next >= queue[i].items.length) queue.splice(i, 1);
  }
  return out;
}

/** SEED CROWD-FLOW: given real and seed listings for a campus, compute the
 *  render list — real first, seeds backfilling up to cap = max(0, 8 - realCount). */
export function crowdFlow<T extends { id: string }>(real: T[], seeds: T[], slots = 8): { render: T[]; seedCount: number } {
  const seedCount = Math.max(0, Math.min(seeds.length, slots - real.length));
  return { render: [...real, ...seeds.slice(0, seedCount)], seedCount };
}

/** FRESH WINDOW: is this listing still inside its first 72h stage time? */
export function inFreshWindow(freshWindowStartedAt: Date | null, now = new Date()): boolean {
  if (!freshWindowStartedAt) return false;
  return now.getTime() - freshWindowStartedAt.getTime() < 72 * 3600 * 1000;
}
