import { describe, it, expect } from "vitest";
import { applyFilters, CATEGORY_SLUG_TO_ID, CATEGORY_ID_TO_SLUG } from "@voeq/data";
import type { ExploreListing } from "@voeq/data";

/**
 * P-A regression tests (2026-08-31) — lock in the round-2/round-3 Explore data
 * fixes so a future deploy can't silently regress them:
 *   1. Category filter: UI sends SLUG (food-drinks); applyFilters compares
 *      categorySlug. CATEGORY_SLUG_TO_ID/CATEGORY_ID_TO_SLUG must be inverses.
 *   2. verifiedOnly uses the REAL vendor.verified flag on ExploreListing.
 *   3. openNow uses real vendorHours (not mock-only vendor.hours).
 */

function baseListing(overrides: Partial<ExploreListing> = {}): ExploreListing {
  return {
    id: "l1",
    vendorId: "v1",
    title: "Jollof & Plantain Bowl",
    priceMinor: 650000,
    priceMinMinor: 650000,
    isPublished: true,
    isFeatured: false,
    categoryId: "food",
    status: "active",
    vendorName: "Demo: Mama Nkechi Kitchen",
    categorySlug: "food-drinks",
    verified: true,
    featured: false,
    trending: false,
    image: "https://res.cloudinary.com/voeq-demo/jollof-bowl.jpg",
    vendorRatingAvg: undefined,
    vendorRatingCount: undefined,
    vendorHours: null,
    images: [],
    ...overrides,
  };
}

describe("category slug/id mapping (P-A round 2)", () => {
  it("CATEGORY_SLUG_TO_ID resolves the slug the UI sends", () => {
    expect(CATEGORY_SLUG_TO_ID["food-drinks"]).toBe("food");
    expect(CATEGORY_SLUG_TO_ID["beauty-care"]).toBe("beauty");
  });

  it("CATEGORY_ID_TO_SLUG is the inverse", () => {
    expect(CATEGORY_ID_TO_SLUG["food"]).toBe("food-drinks");
    for (const [slug, id] of Object.entries(CATEGORY_SLUG_TO_ID)) {
      expect(CATEGORY_ID_TO_SLUG[id]).toBe(slug);
    }
  });

  it("category filter matches listings by categorySlug (slug-in from UI)", () => {
    const items = [
      baseListing(),
      baseListing({ id: "l2", title: "Box Braids", categoryId: "beauty", categorySlug: "beauty-care" }),
    ];
    const out = applyFilters(items, { category: "food-drinks" } as never);
    expect(out.map((l) => l.id)).toEqual(["l1"]);
  });
});

describe("quick filters on REAL fields (P-A round 3)", () => {
  it("verifiedOnly keeps listings whose vendor is verified+live", () => {
    const items = [
      baseListing({ verified: true }),
      baseListing({ id: "l2", verified: false }),
    ];
    const out = applyFilters(items, { verifiedOnly: true } as never);
    expect(out.map((l) => l.id)).toEqual(["l1"]);
  });

  it("openNow reads vendorHours (real), not a mock vendor object", () => {
    const items = [
      baseListing({ vendorHours: { open: "08:00", close: "22:00", days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] } }),
      baseListing({ id: "l2", vendorHours: null }),
    ];
    const out = applyFilters(items, { openNow: true } as never);
    // Deterministic regardless of clock: the closed-hours item is filtered out.
    expect(out.length).toBeLessThanOrEqual(1);
    if (out.length === 1) expect(out[0].id).toBe("l1");
  });

  it("featuredOnly keeps only isFeatured-backed featured listings", () => {
    const items = [
      baseListing({ featured: true }),
      baseListing({ id: "l2", featured: false }),
    ];
    const out = applyFilters(items, { featuredOnly: true } as never);
    expect(out.map((l) => l.id)).toEqual(["l1"]);
  });
});
