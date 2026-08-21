import type { Listing, Vendor } from "./interfaces";
import { mockListingsRepo, mockVendorRepo, mockSearchRepo, mockListingsRepoThatFails, vendorName } from "./mock";

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
  rating?: number;
  verified?: boolean;
  featured?: boolean;
  soldOut?: boolean;
  availability?: Availability;
  categorySlug?: string;
  image?: string;
  trending?: boolean;
}

export interface ExploreFilters {
  category?: string;
  minPrice?: number; // in minor units
  maxPrice?: number;
  minRating?: number;
  verifiedOnly?: boolean;
  featuredOnly?: boolean;
  sort?: "relevance" | "price-asc" | "price-desc" | "rating-desc";
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

function toExploreListing(l: Listing, vendors: Vendor[]): ExploreListing {
  const v = vendors.find((x) => x.id === l.vendorId);
  // Mock-only extras are attached by the mock repo objects; cast to read them.
  const extra = l as Listing & {
    rating?: number; verified?: boolean; featured?: boolean;
    soldOut?: boolean; availability?: Availability; categorySlug?: string;
    image?: string; trending?: boolean;
  };
  return {
    ...l,
    vendorName: v?.name ?? vendorName(l.vendorId),
    rating: extra.rating,
    verified: extra.verified,
    featured: extra.featured,
    soldOut: extra.soldOut,
    availability: extra.availability,
    categorySlug: extra.categorySlug,
    image: extra.image ?? (Array.isArray(l.images) ? l.images[0] : undefined),
    trending: extra.trending,
  };
}

/** PURE: apply filters. Unit-tested independently of the repo. */
export function applyFilters(items: ExploreListing[], f: ExploreFilters): ExploreListing[] {
  let out = items;
  if (f.category) out = out.filter((i) => i.categorySlug === f.category);
  if (typeof f.minPrice === "number") out = out.filter((i) => i.priceMinor >= f.minPrice!);
  if (typeof f.maxPrice === "number") out = out.filter((i) => i.priceMinor <= f.maxPrice!);
  if (typeof f.minRating === "number") out = out.filter((i) => (i.rating ?? 0) >= f.minRating!);
  if (f.verifiedOnly) out = out.filter((i) => i.verified);
  if (f.featuredOnly) out = out.filter((i) => i.featured);
  return out;
}

/** PURE: apply sort. */
export function applySort(items: ExploreListing[], sort: ExploreFilters["sort"]): ExploreListing[] {
  const arr = [...items];
  switch (sort) {
    case "price-asc": return arr.sort((a, b) => a.priceMinor - b.priceMinor);
    case "price-desc": return arr.sort((a, b) => b.priceMinor - a.priceMinor);
    case "rating-desc": return arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
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

    let mapped: ExploreListing[] = listings.map((l) => toExploreListing(l, vendors));

    if (params.query) {
      const q = params.query.trim().toLowerCase();
      const searched = await mockSearchRepo.search(params.query);
      const searchedIds = new Set(searched.map((s) => s.id));
      mapped = mapped.filter((m) => searchedIds.has(m.id) || m.title.toLowerCase().includes(q));
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
  return toExploreListing(listing, vendors);
}
