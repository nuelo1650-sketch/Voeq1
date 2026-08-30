/**
 * P3 verification: a real listing's categorySlug derives from its categoryId,
 * so Explore's category filter actually matches. Creates a real vendor+listing,
 * loads via loadExplore, filters by the canonical slug, asserts it appears.
 */
import { describe, it, expect } from "vitest";
import { mockVendorRepo, mockListingsRepo } from "@voeq/data/server";
import { loadExplore } from "@voeq/data";
import { categories } from "@voeq/data";

const CAMPUS = "unn";

describe("P3: category filter matches a real listing (derived slug)", () => {
  it("listing created with categoryId 'food' surfaces under '/explore?category=food-drinks'", async () => {
    const cat = categories.find((c) => c.id === "food")!;
    expect(cat.slug).toBe("food-drinks");

    const vendor = await mockVendorRepo.create({
      identityId: "p3-fixture",
      name: "P3 Filter Vendor",
      campus: CAMPUS,
      categoryIds: ["food"],
      status: "live",
      description: "Fixture for the P3 category derivation test.",
    });
    await mockListingsRepo.create({
      vendorId: vendor.id,
      title: "P3 Jollof Plate",
      priceMinMinor: 5000,
      categoryId: "food", // stores the canonical id
      description: "Derivation test listing.",
      images: [],
      status: "active",
      isPublished: true,
    });

    try {
      // categorySlug MUST be derived from categoryId for real listings.
      const all = await loadExplore({ campus: CAMPUS });
      const listing = all.data.find((l) => l.title === "P3 Jollof Plate");
      expect(listing).toBeTruthy();
      expect(listing?.categorySlug).toBe("food-drinks");

      // Now apply the category filter the way Explore does.
      const filtered = all.data.filter((l) => l.title === "P3 Jollof Plate" || true);
      const bySlug = all.data.filter((l) => l.categorySlug === cat.slug);
      expect(bySlug.some((l) => l.title === "P3 Jollof Plate")).toBe(true);
    } finally {
      await mockListingsRepo.remove(
        (await mockListingsRepo.list({ campus: CAMPUS })).find((l) => l.title === "P3 Jollof Plate")!.id,
      );
      await mockVendorRepo.patch(vendor.id, { status: "pending_listings" });
    }
  }, 60000);
});
