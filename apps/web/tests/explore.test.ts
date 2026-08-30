import { describe, it, expect } from "vitest";
import { applyFilters, applySort, loadExplore, rankRelevance, rankByRelevance, type ExploreListing } from "@voeq/data";
import { mockVendorRepo, mockListingsRepo } from "@voeq/data/server";

function mk(partial: Partial<ExploreListing> & Pick<ExploreListing, "id" | "vendorId" | "title" | "priceMinor" | "isPublished" | "images">): ExploreListing {
  return { vendorName: "V", ...partial } as ExploreListing;
}

const sample: ExploreListing[] = [
  mk({ id: "a", vendorId: "v1", title: "Alpha", priceMinor: 5000, isPublished: true, images: [], categorySlug: "food", vendorRatingAvg: 4.5, vendorRatingCount: 12, verified: true, featured: false, availability: "open" }),
  mk({ id: "b", vendorId: "v2", title: "Beta", priceMinor: 9000, isPublished: true, images: [], categorySlug: "books", vendorRatingAvg: 3.2, vendorRatingCount: 5, verified: false, featured: true, availability: "open" }),
  mk({ id: "c", vendorId: "v3", title: "Gamma", priceMinor: 12000, isPublished: true, images: [], categorySlug: "food", vendorRatingAvg: 5.0, vendorRatingCount: 20, verified: true, featured: true, availability: "closed", soldOut: true }),
];

describe("applyFilters", () => {
  it("filters by category", () => {
    expect(applyFilters(sample, { category: "food" }).map((x) => x.id)).toEqual(["a", "c"]);
  });
  it("filters by price range", () => {
    expect(applyFilters(sample, { minPrice: 6000, maxPrice: 10000 }).map((x) => x.id)).toEqual(["b"]);
  });
  it("filters by min rating", () => {
    expect(applyFilters(sample, { minRating: 4 }).map((x) => x.id).sort()).toEqual(["a", "c"]);
  });
  it("filters verified-only and featured-only", () => {
    expect(applyFilters(sample, { verifiedOnly: true }).map((x) => x.id).sort()).toEqual(["a", "c"]);
    expect(applyFilters(sample, { featuredOnly: true }).map((x) => x.id).sort()).toEqual(["b", "c"]);
  });
  it("combines filters", () => {
    expect(applyFilters(sample, { category: "food", verifiedOnly: true }).map((x) => x.id)).toEqual(["a", "c"]);
  });
});

describe("applySort", () => {
  it("sorts price ascending", () => {
    expect(applySort(sample, "price-asc").map((x) => x.priceMinor)).toEqual([5000, 9000, 12000]);
  });
  it("sorts price descending", () => {
    expect(applySort(sample, "price-desc").map((x) => x.priceMinor)).toEqual([12000, 9000, 5000]);
  });
  it("sorts rating descending", () => {
    expect(applySort(sample, "rating-desc")[0].id).toBe("c");
  });
});

describe("rankRelevance / rankByRelevance (Phase 2)", () => {
  it("ranks a well-reviewed vendor above a single fluke 5-star", () => {
    const strong = mk({ id: "s", vendorId: "v1", title: "Strong", priceMinor: 5000, isPublished: true, images: [], vendorRatingAvg: 4.6, vendorRatingCount: 20, verified: true });
    const fluke = mk({ id: "f", vendorId: "v2", title: "Fluke", priceMinor: 5000, isPublished: true, images: [], vendorRatingAvg: 5.0, vendorRatingCount: 1, verified: false });
    expect(rankRelevance(strong)).toBeGreaterThan(rankRelevance(fluke));
  });

  it("rewards verified + featured + trending over a plain listing", () => {
    const plain = mk({ id: "p", vendorId: "v1", title: "Plain", priceMinor: 5000, isPublished: true, images: [], vendorRatingAvg: 4.0, vendorRatingCount: 10 });
    const boosted = mk({ id: "b", vendorId: "v2", title: "Boosted", priceMinor: 5000, isPublished: true, images: [], vendorRatingAvg: 4.0, vendorRatingCount: 10, verified: true, featured: true, trending: true });
    expect(rankRelevance(boosted)).toBeGreaterThan(rankRelevance(plain));
  });

  it("engagement (saves + follows) lifts score with diminishing returns", () => {
    const none = mk({ id: "0", vendorId: "v1", title: "None", priceMinor: 5000, isPublished: true, images: [], vendorRatingAvg: 4.0, vendorRatingCount: 10 });
    const some = mk({ id: "1", vendorId: "v2", title: "Some", priceMinor: 5000, isPublished: true, images: [], vendorRatingAvg: 4.0, vendorRatingCount: 10, saveCount: 10, followerCount: 10 });
    expect(rankRelevance(some)).toBeGreaterThan(rankRelevance(none));
  });

  it("rankByRelevance sorts descending by score", () => {
    const low = mk({ id: "lo", vendorId: "v1", title: "Low", priceMinor: 5000, isPublished: true, images: [], vendorRatingAvg: 3.0, vendorRatingCount: 5 });
    const high = mk({ id: "hi", vendorId: "v2", title: "High", priceMinor: 5000, isPublished: true, images: [], vendorRatingAvg: 4.8, vendorRatingCount: 20, verified: true, featured: true });
    const ordered = rankByRelevance([low, high]);
    expect(ordered.map((x) => x.id)).toEqual(["hi", "lo"]);
  });

  it("ties are stable (no NaN, deterministic)", () => {
    const a = mk({ id: "a", vendorId: "v1", title: "A", priceMinor: 5000, isPublished: true, images: [] });
    const b = mk({ id: "b", vendorId: "v2", title: "B", priceMinor: 5000, isPublished: true, images: [] });
    const r1 = rankByRelevance([a, b]);
    const r2 = rankByRelevance([a, b]);
    expect(r1.map((x) => x.id)).toEqual(r2.map((x) => x.id));
    expect(Number.isFinite(rankRelevance(a))).toBe(true);
  });
});

describe("loadExplore", () => {
  it("returns success with mapped listings + trending + vendor names", async () => {
    // 2026-08-29 reset: seed no longer plants demo vendors/listings (founder directive:
    // real vendors only, honest-empty Explore). This test now creates its own fixture
    // vendor + listing through the REAL repos, then asserts Explore surfaces them.
    const campus = "unn"; // seeded verified campus
    const vendor = await mockVendorRepo.create({
      identityId: "explore-test-fixture",
      name: "Explore Test Vendor",
      campus,
      categoryIds: ["food"],
      status: "live",
      description: "Test vendor for loadExplore pipeline verification.",
    });
    await mockListingsRepo.create({
      vendorId: vendor.id,
      title: "Pipeline Test Jollof",
      priceMinMinor: 6500,
      categoryId: "food",
      description: "Fixture listing for the Explore pipeline test.",
      images: [],
      status: "active",
      isPublished: true,
    });

    const res = await loadExplore({ campus });
    expect(res.status).toBe("success");
    expect(res.data.length).toBeGreaterThan(0);
    const found = res.data.find((l) => l.title === "Pipeline Test Jollof");
    expect(found).toBeTruthy();
    expect(found?.vendorName).toBe("Explore Test Vendor");
    expect(res.data.length).toBeGreaterThan(0);

    // Cleanup: remove the fixture listing + make the fixture vendor non-public so
    // the DB stays honest-empty for other tests (VendorRepo has no remove()).
    await mockListingsRepo.remove(
      (await mockListingsRepo.list({ campus })).find((l) => l.title === "Pipeline Test Jollof")!.id,
    );
    await mockVendorRepo.patch(vendor.id, { status: "pending_listings" });
  });

  it("returns empty for a category preset that matches nothing (real zero case)", async () => {
    const res = await loadExplore({ categoryPreset: "zzz" });
    expect(res.status).toBe("empty");
    expect(res.data).toHaveLength(0);
  });

  it("returns error when forceError is set (forced-failure path)", async () => {
    const res = await loadExplore({ forceError: true });
    expect(res.status).toBe("error");
    expect(res.error).toBeTruthy();
  });
});
