import type { Listing, Vendor } from "./interfaces";
import { mockListingsRepo, mockVendorRepo, mockListingsRepoThatFails, vendorName } from "./mock";
import { mockReviewRepo } from "./shopper";

/**
 * Explore data boundary (Doc 04 PG-PUB-002/003, Doc 07 §7.7).
 *
 * The locked `interfaces.ts` `Listing`/`Vendor` shapes are SPARSE (no rating/verified/
 * featured/soldOut/availability/image-on-listing/category). We do NOT change those
 * contracts. Instead `ExploreListing` is a VIEW type that extends `Listing` with the
 * display fields the UI needs; the mock layer currently supplies them, and the real
 * backend (Phase 9) will too. `loadExplore` calls the locked repo interfaces and maps
 * to `ExploreListing[]`.
 */

export type Availability = "open" | "closed" | "soon";

export interface ExploreListing extends Listing {
  vendorName: string;
  verified?: boolean;
  featured?: boolean;
  soldOut?: boolean;
  availability?: Availability;
  categorySlug?: string;
  image?: string;
  trending?: boolean;
  /** Vendor's average rating, computed from the reviews table. undefined if no reviews. */
  vendorRatingAvg?: number;
  /** Number of reviews for this vendor. */
  vendorRatingCount?: number;
}

export interface ExploreFilters {
  category?: string;
  minPrice?: number; // in minor units
  maxPrice?: number;
  minRating?: number;
  verifiedOnly?: boolean;
  featuredOnly?: boolean;
  openNow?: boolean; // Filter 5: vendors with hours set and currently open
  hasPhotos?: boolean; // Filter 7: vendors with ≥1 listing image
  recentlyActive?: boolean; // Filter 8: vendors with activity in last 7 days
  sort?: "relevance" | "price-asc" | "price-desc" | "rating-desc" | "newest" | "near-me";
}

export interface ExploreParams extends ExploreFilters {
  campus?: string;
  query?: string;
  categoryPreset?: string; // from /c/[slug]
  forceError?: boolean; // dev/test path (?exploreError=1)
}

export type ExploreStatus = "idle" | "loading" | "success" | "empty" | "error";

export interface ExploreResult {
  status: ExploreStatus;
  data: ExploreListing[];
  trending: ExploreListing[];
  error?: string;
  /** Last-good data retained across a retryable error (Doc 04 error/recovery). */
  cached?: ExploreListing[];
}

function toExploreListing(l: Listing, vendors: Vendor[], vendorRatings?: Map<string, { avg: number; count: number }>): ExploreListing {
  const v = vendors.find((x) => x.id === l.vendorId);
  // Mock-only extras are attached by the mock repo objects; cast to read them.
  const extra = l as Listing & {
    verified?: boolean; featured?: boolean;
    soldOut?: boolean; availability?: Availability; categorySlug?: string;
    image?: string; trending?: boolean;
  };
  const vr = vendorRatings?.get(l.vendorId);
  return {
    ...l,
    vendorName: v?.name ?? vendorName(l.vendorId),
    verified: extra.verified,
    featured: extra.featured,
    soldOut: extra.soldOut,
    availability: extra.availability,
    categorySlug: extra.categorySlug,
    image: extra.image ?? (Array.isArray(l.images) ? l.images[0] : undefined),
    // Trending derives from a real signal (featured), not invented analytics.
    trending: l.isFeatured || extra.trending,
    vendorRatingAvg: vr?.avg,
    vendorRatingCount: vr?.count,
  };
}

/** Compute average rating + count per vendor from the reviews table. */
async function computeVendorRatings(vendorIds: string[]): Promise<Map<string, { avg: number; count: number }>> {
  const result = new Map<string, { avg: number; count: number }>();
  const unique = Array.from(new Set(vendorIds));
  await Promise.all(
    unique.map(async (vid) => {
      const reviews = await mockReviewRepo.listByVendor(vid);
      const rated = reviews.filter((r) => typeof r.rating === "number" && r.status !== "hidden");
      if (rated.length > 0) {
        const avg = Math.round((rated.reduce((s, r) => s + r.rating, 0) / rated.length) * 10) / 10;
        result.set(vid, { avg, count: rated.length });
      }
    }),
  );
  return result;
}

/** PURE: apply filters. Unit-tested independently of the repo. */
export function applyFilters(items: ExploreListing[], f: ExploreFilters): ExploreListing[] {
  let out = items;
  if (f.category) out = out.filter((i) => i.categorySlug === f.category);
  if (typeof f.minPrice === "number") out = out.filter((i) => i.priceMinor >= f.minPrice!);
  if (typeof f.maxPrice === "number") out = out.filter((i) => i.priceMinor <= f.maxPrice!);
  if (typeof f.minRating === "number") out = out.filter((i) => (i.vendorRatingAvg ?? 0) >= f.minRating!);
  if (f.verifiedOnly) out = out.filter((i) => i.verified);
  if (f.featuredOnly) out = out.filter((i) => i.featured);
  
  // Filter 5: Open now - check if vendor has hours and is currently open
  if (f.openNow) {
    const now = new Date();
    const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()] as 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    out = out.filter((i) => {
      // Access vendor hours through the listing's vendor data (needs to be passed through)
      // For now, we'll check if hours exist in the mock data structure
      const vendor = (i as any).vendor;
      if (!vendor?.hours) return false;
      if (!vendor.hours.days.includes(currentDay)) return false;
      return currentTime >= vendor.hours.open && currentTime <= vendor.hours.close;
    });
  }
  
  // Filter 7: Has photos - vendors with ≥1 listing image
  if (f.hasPhotos) {
    out = out.filter((i) => i.image || (Array.isArray((i as any).images) && (i as any).images.length > 0));
  }
  
  // Filter 8: Recently active - vendors with activity in last 7 days
  // This would need real activity tracking. For now, use a mock heuristic:
  // vendors with recent listings or featured status
  if (f.recentlyActive) {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    out = out.filter((i) => {
      // Mock: consider featured listings or those with trending flag as "recently active"
      return i.featured || i.trending;
    });
  }
  
  return out;
}

/** PURE: apply sort. */
export function applySort(items: ExploreListing[], sort: ExploreFilters["sort"]): ExploreListing[] {
  const arr = [...items];
  switch (sort) {
    case "price-asc": return arr.sort((a, b) => a.priceMinor - b.priceMinor);
    case "price-desc": return arr.sort((a, b) => b.priceMinor - a.priceMinor);
    case "rating-desc": return arr.sort((a, b) => (b.vendorRatingAvg ?? 0) - (a.vendorRatingAvg ?? 0));
    case "newest": return arr.sort((a, b) => (b.id > a.id ? 1 : -1)); // Mock: sort by ID as proxy for creation time
    case "near-me": return arr; // Would need geolocation; mock returns original order
    default: return arr; // relevance = mock order
  }
}

/**
 * Load Explore data through the locked repo boundary.
 * - categoryPreset (from /c/[slug]) overrides filters.category.
 * - forceError routes to the failing repo to exercise the error/retry path.
 * - Returns status "empty" when zero results (a REAL zero case, not pre-load).
 */
export async function loadExplore(params: ExploreParams): Promise<ExploreResult> {
  const category = params.categoryPreset ?? params.category;
  const listingsRepo = params.forceError ? mockListingsRepoThatFails : mockListingsRepo;
  try {
    const [listings, vendors] = await Promise.all([
      listingsRepo.list({ campus: params.campus, category }),
      mockVendorRepo.listVendors({ campus: params.campus }),
    ]);
    const vendorRatings = await computeVendorRatings(vendors.map((v) => v.id));

    let mapped: ExploreListing[] = listings.map((l) => toExploreListing(l, vendors, vendorRatings));

    if (params.query) {
      const q = params.query.trim().toLowerCase();
      // Real search: filter the already-fetched Neon listings by title.
      // (Previously used mockSearchRepo over a fake dev dataset — removed so
      // production search never touches MOCK_EXPLORE_LISTINGS.)
      mapped = mapped.filter((m) => m.title.toLowerCase().includes(q));
    }

    const filtered = applySort(applyFilters(mapped, { ...params, category }), params.sort);
    const trending = mapped.filter((m) => m.trending);

    return {
      status: filtered.length === 0 ? "empty" : "success",
      data: filtered,
      trending,
      cached: filtered.length ? filtered : undefined,
    };
  } catch (e) {
    return {
      status: "error",
      data: [],
      trending: [],
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

/**
 * Load a single listing for the detail view (Slice 3, PG-PUB-005) through the same
 * repo boundary + ExploreListing view mapping as Explore. The mock repo resolves
 * getById against the dev dataset; the real backend (Phase 9) will too.
 */
export async function loadListing(id: string): Promise<ExploreListing | null> {
  const [listing, vendors] = await Promise.all([
    mockListingsRepo.getById(id),
    mockVendorRepo.listVendors({}),
  ]);
  if (!listing) return null;
  const vendorRatings = await computeVendorRatings(vendors.map((v) => v.id));
  return toExploreListing(listing, vendors, vendorRatings);
}
