/**
 * Vendor storefront data boundary (Doc 04 PG-PUB-004, Doc 07 §8.4).
 *
 * The locked `interfaces.ts` `Vendor`/`Listing` shapes are SPARSE. We do NOT change
 * those contracts. `VendorStorefrontView` is a VIEW model (Doc 07 §8.4 — a projection,
 * not six tables) that extends `Vendor` with the display fields the UI needs: the
 * vendor's own listings (mapped to `ExploreListing`), a DERIVED rating avg/count from
 * those listings' real ratings (never invented), and an honest empty `reviews` array
 * (no fake reviews per founder rule). The mock layer supplies the data; the real
 * backend (Phase 9) will too.
 */

import type { Listing, Vendor, Review } from "./interfaces";
import { mockVendorRepo, mockListingsRepo, vendorName, type MockListingExtra } from "./mock";
import type { ExploreListing } from "./explore";
import { mockReviewRepo } from "./shopper";

// Local mapper mirroring `toExploreListing` in explore.ts so this module stays
// independent of that file. Reads the mock-only extras already attached to each listing.
function toExploreListingLocal(l: Listing & MockListingExtra, vendorDisplayName: string): ExploreListing {
  return {
    ...l,
    vendorName: vendorDisplayName,
    verified: l.verified,
    soldOut: l.soldOut,
    availability: l.availability,
    categorySlug: l.categorySlug,
    image: l.image ?? (Array.isArray(l.images) ? l.images[0] : undefined),
    trending: l.isFeatured || l.trending,
  };
}

export interface VendorStorefrontView extends Vendor {
  listings: ExploreListing[];
  /** Derived from the vendor's own listing ratings — honest, never invented. */
  ratingAvg?: number;
  ratingCount: number;
  verifiedCount: number;
  listingCount: number;
  /** Honest: empty until real reviews exist (founder rule — no fake reviews). */
  reviews: Review[];
}

/**
 * Load a vendor storefront through the locked repo boundary + the same
 * ExploreListing view mapping as Explore. Resolves by id OR handle for the
 * curated storefront fixtures (v1-v6, which have real listings), and by id OR
 * slug for the hand-curated Explore showcase vendors (1-12) — those render a
 * graceful storefront (hero + honest empty listings/reviews) rather than 404.
 * Returns null only for an id/slug that matches nothing (route calls notFound()).
 */
/** Compute average rating + count for a vendor from the reviews table. */
async function vendorRatingFromReviews(vendorId: string): Promise<{ ratingAvg: number | undefined; ratingCount: number }> {
  const reviews = await mockReviewRepo.listByVendor(vendorId);
  const rated = reviews.filter((r) => typeof r.rating === "number" && r.status !== "hidden");
  if (rated.length === 0) return { ratingAvg: undefined, ratingCount: 0 };
  const ratingAvg = Math.round((rated.reduce((s, r) => s + r.rating, 0) / rated.length) * 10) / 10;
  return { ratingAvg, ratingCount: rated.length };
}

export async function loadVendorStorefront(idOrSlug: string): Promise<VendorStorefrontView | null> {
  // P4 (2026-08-29): mock purge — the curated fixture branch (v1-v6 with mock
  // listings) and the hand-curated showcase branch are REMOVED. Storefronts
  // resolve from REAL vendors only. A slug that matches no real vendor 404s.
  // The page's canVendorBePublic() gate still decides 404 vs render, so the
  // visibility precondition (status === "live") is preserved.
  let real = await mockVendorRepo.getById(idOrSlug);
  if (!real) {
    real = (await mockVendorRepo.listVendors()).find((v) => v.slug === idOrSlug) ?? null;
  }
  if (real) {
    const campusListings = await mockListingsRepo.list({ campus: real.campus });
    const listings = campusListings
      .filter((l) => l.vendorId === real.id)
      .map((l) => toExploreListingLocal(l as Listing & MockListingExtra, real.name ?? vendorName(real.id)));
    const reviews = await mockReviewRepo.listByVendor(real.id);
    const { ratingAvg, ratingCount } = await vendorRatingFromReviews(real.id);
    return {
      ...real,
      listings,
      ratingAvg,
      ratingCount,
      verifiedCount: listings.filter((m) => m.verified).length,
      listingCount: listings.length,
      reviews,
    };
  }

  return null;
}
