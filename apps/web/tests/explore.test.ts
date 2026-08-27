import { describe, it, expect } from "vitest";
import { applyFilters, applySort, loadExplore, type ExploreListing } from "@voeq/data";

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

describe("loadExplore", () => {
  it("returns success with mapped listings + trending + vendor names", async () => {
    const res = await loadExplore({ campus: "nmu" });
    expect(res.status).toBe("success");
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].vendorName).toBeTruthy();
    expect(res.trending.length).toBeGreaterThan(0);
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
