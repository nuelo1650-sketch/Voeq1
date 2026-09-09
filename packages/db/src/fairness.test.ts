/** MONEY BAG A2 — unit tests for the fairness algorithm (pure functions).
 *  Run: npx vitest run fairness.test.ts
 *  Property + edge-case tests. The algorithm MUST be correct before anything renders.
 */
import { describe, it, expect } from "vitest";
import {
  ratingConfidence, engagement30d, freshness, completeness,
  vendorScore, showcaseEligible, fairShareOrder, crowdFlow, inFreshWindow,
} from "../src/fairness";

describe("ratingConfidence (Wilson)", () => {
  it("0 reviews scores 0 (no data = no confidence)", () => {
    expect(ratingConfidence(5, 0)).toBe(0);
  });
  it("5.0 from 3 reviews is LOW confidence (< 0.6)", () => {
    expect(ratingConfidence(5, 3)).toBeLessThan(0.6);
  });
  it("4.9 from 300 reviews is HIGH confidence (> 0.8)", () => {
    expect(ratingConfidence(4.9, 300)).toBeGreaterThan(0.8);
  });
  it("more reviews never lowers confidence for same stars", () => {
    for (const stars of [3.5, 4.2, 5]) {
      expect(ratingConfidence(stars, 300)).toBeGreaterThanOrEqual(ratingConfidence(stars, 10));
    }
  });
  it("clamps out-of-range stars", () => {
    expect(ratingConfidence(9, 10)).toBeGreaterThanOrEqual(0);
    expect(ratingConfidence(-1, 10)).toBeGreaterThanOrEqual(0);
  });
});

describe("engagement30d", () => {
  it("caps at 1 (500 weighted points)", () => {
    expect(engagement30d(500, 500, 500)).toBe(1);
  });
  it("weights follows > saves > messages", () => {
    expect(engagement30d(0, 50, 0)).toBeGreaterThan(engagement30d(50, 0, 0));
    expect(engagement30d(50, 0, 0)).toBeGreaterThan(engagement30d(0, 0, 50));
  });
});

describe("freshness", () => {
  it("today = 1", () => expect(freshness(0)).toBe(1));
  it("14+ days = 0", () => expect(freshness(14)).toBe(0));
  it("7 days = 0.5", () => expect(freshness(7)).toBeCloseTo(0.5));
  it("negative input = 0", () => expect(freshness(-3)).toBe(0));
});

describe("completeness", () => {
  it("empty profile = 0", () => {
    expect(completeness({ photo: false, listings: 0, description: false, socials: false })).toBe(0);
  });
  it("full profile = 1", () => {
    expect(completeness({ photo: true, listings: 3, description: true, socials: true })).toBe(1);
  });
  it("listings scale fractionally below 3", () => {
    expect(completeness({ photo: false, listings: 1, description: false, socials: false })).toBeCloseTo(0.1);
  });
});

describe("vendorScore", () => {
  it("a fresh complete vendor outscores an inactive complete one", () => {
    const base = { stars: 4.8, reviewCount: 30, photo: true, listings: 5, description: true, socials: true };
    const active = vendorScore({ ...base, saves: 40, follows: 20, messages: 10, lastUpdateDaysAgo: 1 });
    const stale = vendorScore({ ...base, saves: 40, follows: 20, messages: 10, lastUpdateDaysAgo: 13 });
    expect(active.score).toBeGreaterThan(stale.score);
  });
  it("breakdown sums with weights to score", () => {
    const { score, breakdown } = vendorScore({ stars: 4.5, reviewCount: 40, saves: 30, follows: 10, messages: 5, lastUpdateDaysAgo: 5, photo: true, listings: 4, description: true, socials: false });
    const weighted = 0.35 * breakdown.ratingConfidence + 0.25 * breakdown.engagement30d + 0.2 * breakdown.freshness + 0.2 * breakdown.completeness;
    expect(score).toBeCloseTo(weighted, 10);
  });
});

describe("showcaseEligible (rotation guarantee)", () => {
  it("under 14 consecutive days = eligible", () => {
    expect(showcaseEligible(13, 0)).toBe(true);
  });
  it("at 14 days, needs 7d cooldown", () => {
    expect(showcaseEligible(14, 6)).toBe(false);
    expect(showcaseEligible(14, 7)).toBe(true);
  });
});

describe("fairShareOrder (round-robin)", () => {
  it("no two consecutive cards from the same vendor", () => {
    const buckets = [
      { vendorId: "A", items: [{ id: "a1" }, { id: "a2" }, { id: "a3" }] },
      { vendorId: "B", items: [{ id: "b1" }, { id: "b2" }, { id: "b3" }] },
      { vendorId: "C", items: [{ id: "c1" }, { id: "c2" }, { id: "c3" }] },
    ];
    const order = fairShareOrder(buckets);
    for (let i = 1; i < order.length; i++) {
      expect(order[i].vendorId).not.toBe(order[i - 1].vendorId);
    }
  });
  it("uneven buckets: every vendor cycles before leftovers append", () => {
    const buckets = [
      { vendorId: "A", items: [{ id: "a1" }, { id: "a2" }, { id: "a3" }] },
      { vendorId: "B", items: [{ id: "b1" }] },
    ];
    const order = fairShareOrder(buckets);
    const firstTwoVendors = [order[0].vendorId, order[1].vendorId];
    expect(firstTwoVendors).toContain("A");
    expect(firstTwoVendors).toContain("B"); // B's single item cycles in the first pass
  });
  it("empty buckets are skipped", () => {
    const order = fairShareOrder([{ vendorId: "A", items: [] }, { vendorId: "B", items: [{ id: "b1" }] }]);
    expect(order).toHaveLength(1);
  });
});

describe("crowdFlow (founder rule: seeds join, never overtake)", () => {
  const real = Array.from({ length: 8 }, (_, i) => ({ id: "r" + i }));
  const seeds = Array.from({ length: 10 }, (_, i) => ({ id: "s" + i }));
  it("8+ real listings = zero seeds render", () => {
    const { render, seedCount } = crowdFlow(real, seeds);
    expect(seedCount).toBe(0);
    expect(render.every((r) => r.id.startsWith("r"))).toBe(true);
  });
  it("3 real listings backfill exactly 5 seeds (cap 8)", () => {
    const { render, seedCount } = crowdFlow(real.slice(0, 3), seeds);
    expect(seedCount).toBe(5);
    expect(render).toHaveLength(8);
    expect(render.slice(0, 3).every((r) => r.id.startsWith("r"))).toBe(true); // real first
  });
  it("0 real = seeds fill but never exceed cap", () => {
    const { render, seedCount } = crowdFlow([], seeds);
    expect(seedCount).toBe(8);
    expect(render).toHaveLength(8);
  });
  it("real always precedes seeds in the render", () => {
    const { render } = crowdFlow(real.slice(0, 2), seeds.slice(0, 6));
    const lastReal = render.map((r) => r.id.startsWith("r")).lastIndexOf(true);
    const firstSeed = render.findIndex((r) => r.id.startsWith("s"));
    expect(lastReal).toBeLessThan(firstSeed);
  });
});

describe("inFreshWindow (72h stage time)", () => {
  const now = new Date("2026-09-08T12:00:00Z");
  it("1h ago = in window", () => {
    expect(inFreshWindow(new Date(now.getTime() - 3600 * 1000), now)).toBe(true);
  });
  it("73h ago = out", () => {
    expect(inFreshWindow(new Date(now.getTime() - 73 * 3600 * 1000), now)).toBe(false);
  });
  it("null = never in window", () => {
    expect(inFreshWindow(null, now)).toBe(false);
  });
});
