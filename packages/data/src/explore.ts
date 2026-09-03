import type { Listing, Vendor } from "./interfaces";
import { mockListingsRepo, mockVendorRepo, mockListingsRepoThatFails, vendorName } from "./mock";
import { mockReviewRepo, countSavesByVendor, mockFollowRepo } from "./shopper";
import { CATEGORY_ID_TO_SLUG, CATEGORY_SLUG_TO_ID } from "./explore-view";

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
  /** Real vendor operating hours (VS5.3), used for the Open-now quick filter. */
  vendorHours?: { open: string; close: string; days: string[] } | null;
  /** Real saved-count for this vendor (direct saves + saves of their listings). */
  saveCount?: number;
  /** Real follower-count for this vendor. */
  followerCount?: number;
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
  // P3 (2026-08-29): real Neon listings carry a categoryId but no categorySlug
  // column, so a mock-only read left categorySlug undefined and EVERY category
  // filter silently returned nothing. Derive it from the canonical id->slug map.
  const categorySlug = extra.categorySlug ?? CATEGORY_ID_TO_SLUG[l.categoryId];
  // P-A round 2 (2026-08-31): honest quick-filter fields. `verified`, `featured`,
  // `hours` and status come from the REAL vendor/listing rows (mock `extra`
  // fields would be undefined for Neon data and make verifiedOnly/openNow
  // filters silently return empty). Fall back to the mock extras only when the
  // vendor object is absent (dev fixtures).
  const verifiedFlag = v ? Boolean(v.verified && v.status === "live") : Boolean(extra.verified);
  return {
    ...l,
    vendorName: v?.name ?? vendorName(l.vendorId),
    verified: verifiedFlag,
    featured: l.isFeatured || Boolean(extra.featured),
    soldOut: extra.soldOut,
    availability: extra.availability,
    vendorHours: v?.hours ?? null,
    categorySlug,
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
      // Real vendor hours were mapped into vendorHours by toExploreListing.
      const hours = i.vendorHours;
      if (!hours || !Array.isArray(hours.days)) return false;
      if (!hours.days.includes(currentDay)) return false;
      return currentTime >= hours.open && currentTime <= hours.close;
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

/**
 * PURE: weighted relevance score for "Most popular" (Phase 2).
 * Honest weighted blend of REAL engagement signals the system already records
 * (rating with count-confidence, verified, featured, trending, saves, follows).
 * High = more popular. No invented data; missing signals contribute 0.
 *
 * Weights (sum 100):
 *   50 rating   — confidence-smoothed avg rating (a single 5-star ≠ 20 five-stars)
 *   20 engagement — log(1 + saves + follows), scaled to 0..1
 *   15 verified — real VS7.8 staff flag
 *   10 featured — real VS7.9 staff feature flag
 *   5  trending — momentum proxy (featured/traffic flag already on the listing)
 */
export function rankRelevance(l: ExploreListing): number {
  // 1) Rating signal (0..1): avg rating scaled 0..5, then confidence-smoothed by review count.
  //    A vendor with 1 review at 5.0 scores far lower than one with 20 reviews at 4.6.
  const ratingAvg = l.vendorRatingAvg ?? 0;
  const ratingCount = l.vendorRatingCount ?? 0;
  const ratingConfidence = Math.min(1, ratingCount / 10); // 10+ reviews => full confidence
  const ratingSignal = (ratingAvg / 5) * ratingConfidence; // 0..1

  // 2) Engagement signal (0..1): log-scaled so a few saves/follows give a big early lift,
  //    but diminishing returns at scale (1 save => ~0.3, 10 => ~0.58, 100 => ~0.83).
  const engagementRaw = (l.saveCount ?? 0) + (l.followerCount ?? 0);
  const engagementSignal = engagementRaw > 0
    ? Math.log(1 + engagementRaw) / Math.log(1 + 100)
    : 0;

  // 3-5) Boolean signals.
  const verifiedSignal = l.verified ? 1 : 0;
  const featuredSignal = l.featured ? 1 : 0;
  const trendingSignal = l.trending ? 1 : 0;

  return (
    50 * ratingSignal +
    20 * engagementSignal +
    15 * verifiedSignal +
    10 * featuredSignal +
    5 * trendingSignal
  );
}

/** PURE: sort by weighted relevance score, descending. */
export function rankByRelevance(items: ExploreListing[]): ExploreListing[] {
  return [...items].sort((a, b) => rankRelevance(b) - rankRelevance(a));
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
    default: return rankByRelevance(arr); // relevance = weighted score (Phase 2)
  }
}

/**
 * Load Explore data through the locked repo boundary.
 * - categoryPreset (from /c/[slug]) overrides filters.category.
 * - forceError routes to the failing repo to exercise the error/retry path.
 * - Returns status "empty" when zero results (a REAL zero case, not pre-load).
 */
export async function loadExplore(params: ExploreParams): Promise<ExploreResult> {
  // P-A fix (2026-08-31): the Explore UI/Filters send category SLUG (food-drinks)
  // but the repo's list({category}) filters the DB category_id column by ID
  // ("food"). Resolve slug -> id for the repo layer; applyFilters (lower down)
  // still uses the slug against categorySlug. Without this, EVERY category
  // filter silently returned empty on real data.
  // P-A round 76 (CONSISTENCY FIX): the API accepted BOTH the category ID
  // ('beauty') and slug ('beauty-care'); the ID path resolved to the repo but
  // applyFilters then matched categorySlug against the ID => silent 0 results
  // (e.g. ?category=beauty -> empty, ?category=beauty-care -> 4). Normalize an
  // ID to its canonical slug FIRST so both forms behave identically.
  const rawSlug = params.categoryPreset ?? params.category;
  const categorySlug = rawSlug ? (CATEGORY_ID_TO_SLUG[rawSlug] ?? rawSlug) : undefined;
  const categoryId = categorySlug ? CATEGORY_SLUG_TO_ID[categorySlug] ?? categorySlug : undefined;
  const categoryForRepo = categoryId;
  const listingsRepo = params.forceError ? mockListingsRepoThatFails : mockListingsRepo;
  try {
    const [listings, vendors] = await Promise.all([
      // P-A round 69: Explore is PUBLIC -> publicOnly (published+active+live vendor).
      listingsRepo.list({ campus: params.campus, category: categoryForRepo, publicOnly: true }),
      mockVendorRepo.listVendors({ campus: params.campus, publicOnly: true }),
    ]);
    // P-A round 75 (N+1 FIX — the 'Neon flaky' root cause): the old code ran
    // computeVendorRatings + countSavesByVendor + listByVendor for EVERY vendor
    // the DB knows (219!) even though only vendors WITH listings matter. That
    // spawned ~650 parallel fetches -> Neon pooler -> 'fetch failed' -> the
    // explore 'zzz' test intermittently errored. Restrict to vendors that
    // actually appear in the result listing set.
    const relevantVendorIds = Array.from(new Set(listings.map((l) => l.vendorId)));
    const vendorRatings = await computeVendorRatings(relevantVendorIds);

    // Phase 2: real engagement signal per vendor (saves + follows) for the relevance score.
    const vendorEngagement: Map<string, { saves: number; follows: number }> = new Map();
    await Promise.all(
      relevantVendorIds.map(async (vid) => {
        const [saves, follows] = await Promise.all([
          countSavesByVendor(vid),
          mockFollowRepo.listByVendor(vid).then((f) => f.length),
        ]);
        vendorEngagement.set(vid, { saves, follows });
      }),
    );

    let mapped: ExploreListing[] = listings.map((l) => {
      const base = toExploreListing(l, vendors, vendorRatings);
      const eng = vendorEngagement.get(l.vendorId);
      return { ...base, saveCount: eng?.saves ?? 0, followerCount: eng?.follows ?? 0 };
    });

    if (params.query) {
      const q = params.query.trim().toLowerCase();
      // P-A round 57 (C6): real search matched listing TITLES only — a shopper
      // searching a VENDOR's name ("Glam", "Legacy", "Mama Nkechi") got the
      // "campus is waking up" empty state. Now match vendor name too.
      mapped = mapped.filter((m) => {
        const title = (m.title ?? "").toLowerCase();
        const vendor = (m.vendorName ?? "").toLowerCase();
        return title.includes(q) || vendor.includes(q);
      });
    }

    const filtered = applySort(applyFilters(mapped, { ...params, category: categorySlug }), params.sort);
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
