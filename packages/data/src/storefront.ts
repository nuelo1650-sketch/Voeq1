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
import { mockVendorsRepo, vendorName, listListingsByVendor, type MockListingExtra } from "./mock";
import type { ExploreListing } from "./explore";

// Local mapper mirroring `toExploreListing` in explore.ts so this module stays
// independent of that file. Reads the mock-only extras already attached to each listing.
function toExploreListingLocal(l: Listing & MockListingExtra, vendorDisplayName: string): ExploreListing {
  return {
    ...l,
    vendorName: vendorDisplayName,
    rating: l.rating,
    verified: l.verified,
    soldOut: l.soldOut,
    availability: l.availability,
    categorySlug: l.categorySlug,
    image: l.image ?? (Array.isArray(l.images) ? l.images[0] : undefined),
    trending: l.trending,
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
 * ExploreListing view mapping as Explore. Returns null for an unknown id
 * (route must call notFound()).
 */
export async function loadVendorStorefront(id: string): Promise<VendorStorefrontView | null> {
  const vendor = await mockVendorsRepo.getById(id);
  if (!vendor) return null;

  const displayName = vendor.name ?? vendorName(id);
  const listings = listListingsByVendor(id).map((l) => toExploreListingLocal(l, displayName));

  const rated = listings.filter((m) => typeof m.rating === "number");
  const ratingAvg =
    rated.length > 0
      ? rated.reduce((sum, m) => sum + (m.rating as number), 0) / rated.length
      : undefined;

  return {
    ...vendor,
    listings,
    ratingAvg,
    ratingCount: rated.length,
    verifiedCount: listings.filter((m) => m.verified).length,
    listingCount: listings.length,
    reviews: [],
  };
}
