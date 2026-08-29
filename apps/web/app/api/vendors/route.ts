import { NextRequest, NextResponse } from "next/server";
import { mockVendorRepo, mockListingsRepo, mockReviewRepo, categories } from "@voeq/data/server";
import type { VendorSummary } from "@voeq/data";

/**
 * VS-PROC — Vendor directory feed for the landing TrendingRail (F-A9).
 *
 * P4 (2026-08-29): mock purge. Returns REAL vendors from Neon only — mapped to
 * VendorSummary (derived rating from the vendor's reviews, price range from its
 * listings). When Neon has no vendors, this returns an honest EMPTY list. No
 * showcase fallback — no fake data ships to users, ever.
 */
export async function GET(req: NextRequest) {
  const campus = req.nextUrl.searchParams.get("campus") ?? undefined;

  const realVendors = await mockVendorRepo.listVendors(campus ? { campus } : undefined);
  if (realVendors.length === 0) {
    // Honest empty: real Neon has no vendors yet. No showcase fallback (P4).
    return NextResponse.json({ vendors: [], source: "neon" });
  }

  const summary: VendorSummary[] = await Promise.all(
    realVendors.map(async (v) => {
      const cat = categories.find((c) => c.id === v.categoryIds[0]);
      const listings = (await mockListingsRepo.list({ campus: v.campus })).filter((l) => l.vendorId === v.id);
      const reviews = await mockReviewRepo.listByVendor(v.id);
      const rating = reviews.length > 0 ? reviews.reduce((s, r) => s + (r.rating as number), 0) / reviews.length : 0;
      const prices = listings.flatMap((l) => [l.priceMinMinor, l.priceMaxMinor].filter((p): p is number => typeof p === "number"));
      const priceRange =
        prices.length > 0
          ? { min: Math.min(...prices), max: Math.max(...prices), currency: "NGN" }
          : undefined;
      return {
        id: v.id,
        slug: v.slug,
        name: v.name,
        category: cat?.name ?? "General",
        categorySlug: cat?.slug ?? "general",
        categoryColor: cat?.color ?? "#2D5A3D",
        photoUrl: v.profilePhotoUrl,
        rating: Math.round(rating * 10) / 10,
        reviewCount: reviews.length,
        status: "open" as const,
        campusId: v.campus,
        priceRange,
        tags: [] as VendorSummary["tags"],
      } satisfies VendorSummary;
    }),
  );

  return NextResponse.json({ vendors: summary, source: "neon" });
}
