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
import { MOCK_VENDORS, mockVendorRepo, vendorName, listListingsByVendor, type MockListingExtra } from "./mock";
import type { ExploreListing } from "./explore";
import { vendors as showcaseVendors } from "./explore-view";

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
 * ExploreListing view mapping as Explore. Resolves by id OR handle for the
 * curated storefront fixtures (v1-v6, which have real listings), and by id OR
 * slug for the hand-curated Explore showcase vendors (1-12) — those render a
 * graceful storefront (hero + honest empty listings/reviews) rather than 404.
 * Returns null only for an id/slug that matches nothing (route calls notFound()).
 */
export async function loadVendorStorefront(idOrSlug: string): Promise<VendorStorefrontView | null> {
  // 1) Curated storefront fixture (has real listings).
  const fixture = MOCK_VENDORS.find((v) => v.id === idOrSlug || v.handle === idOrSlug);
  if (fixture) {
    const displayName = fixture.name ?? vendorName(fixture.id);
    const listings = listListingsByVendor(fixture.id).map((l) => toExploreListingLocal(l, displayName));
    const rated = listings.filter((m) => typeof m.rating === "number");
    const ratingAvg = rated.length > 0 ? rated.reduce((s, m) => s + (m.rating as number), 0) / rated.length : undefined;
    return {
      ...fixture,
      listings,
      ratingAvg,
      ratingCount: rated.length,
      verifiedCount: listings.filter((m) => m.verified).length,
      listingCount: listings.length,
      reviews: [],
    };
  }

  // 2) Hand-curated Explore showcase vendor (no listings yet) — graceful storefront,
  //    never a 404. Reuses StorefrontHero/Grid/Trust's honest empty states.
  const showcase = showcaseVendors.find((v) => v.id === idOrSlug || v.slug === idOrSlug);
  if (showcase) {
    return {
      id: showcase.id,
      name: showcase.name,
      handle: showcase.slug,
      campus: showcase.campusId,
      categoryIds: [showcase.categorySlug],
      status: "live",
      description: "",
      subArea: null,
      profilePhotoUrl: null,
      agreementVersion: null,
      agreementAcceptedAt: null,
      identityId: null,
      slug: showcase.slug,
      listings: [],
      ratingAvg: showcase.rating,
      ratingCount: showcase.reviewCount,
      verifiedCount: 0,
      listingCount: 0,
      reviews: [],
    };
  }

  return null;
}
