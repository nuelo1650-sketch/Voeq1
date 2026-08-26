import { NextRequest, NextResponse } from "next/server";
import { mockVendorRepo, mockListingsRepo, mockReviewRepo, categories } from "@voeq/data/server";
import { vendors as showcaseVendors, type VendorSummary } from "@voeq/data";

/**
 * VS-PROC — Vendor directory feed for the landing TrendingRail (F-A9).
 *
 * Prod (USE_REAL / DATABASE_URL set): returns REAL vendors from Neon, mapped to
 * VendorSummary (derived rating from the vendor's listing ratings, price range
 * from its listings). No fake data ships to users.
 *
 * Dev (no DATABASE_URL): returns the curated showcase so the landing still looks
 * populated locally. This is the ONLY place the showcase is used in prod — it is
 * never sent to real users.
 */
export async function GET(req: NextRequest) {
  const campus = req.nextUrl.searchParams.get("campus") ?? undefined;

  const realVendors = await mockVendorRepo.listVendors(campus ? { campus } : undefined);
  if (realVendors.length === 0) {
    // Dev fallback: curated showcase (not used in prod where Neon has data).
    return NextResponse.json({ vendors: showcaseVendors, source: "showcase" });
  }

  const summary: VendorSummary[] = await Promise.all(
    realVendors.map(async (v) => {
      const listings = mockListingsRepo.list({ campus: v.campus }).filter((l) => l.vendorId === v.id);
      const rated = listings.filter((l) => typeof l.rating === "number");
      const rating = rated.length > 0 ? rated.reduce((s, l) => s + (l.rating as number), 0) / rated.length : 0;
      const prices = listings.flatMap((l) => [l.priceMinMinor, l.priceMaxMinor].filter((p): p is number => typeof p === "number"));
      const priceRange =
        prices.length > 0
          ? { min: Math.min(...prices), max: Math.max(...prices), currency: "NGN" }
          : undefined;
      const cat = categories.find((c) => c.id === v.categoryIds[0]);
      const reviews = await mockReviewRepo.listByVendor(v.id);
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
