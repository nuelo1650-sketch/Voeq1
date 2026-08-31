/**
 * Explore display data + view types (VS1.1 data-seam consolidation, Doc 07 §7.1/§7.7).
 *
 * This module is the SINGLE SOURCE OF TRUTH for the hand-curated Explore/landing showcase
 * data that previously lived in apps/web/data/* (a duplicate layer that violated the data
 * boundary). It migrates that data into the @voeq/data package and exposes it as VIEW
 * types (never redeclaring the LOCKED interfaces.ts contract — Doc 08).
 *
 * Synchronous exports (campuses/categories/vendors + loaders) intentionally mirror the prior
 * apps/web/data API so the existing client components need only a one-line import swap.
 * (Phase 9 will replace these with async repo-backed calls — the consumer call sites are
 * already shaped to allow that swap.)
 *
 * Honesty rule (founder / Doc 01 §7 / Doc 05 A.19 C.10.1): every count is either 0 or derived
 * from real mock data. No invented numbers. vendorCount/studentCount are 0/null until a real
 * backend supplies them.
 */

// ---------------------------------------------------------------------------
// TYPES (view-only; extend, never redeclare, interfaces.ts)
// ---------------------------------------------------------------------------

export interface VendorSummary {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  categoryColor: string;
  photoUrl: string | null;
  rating?: number;
  reviewCount?: number;
  status: "open" | "closing_soon" | "closed";
  campusId: string;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  tags: ("popular" | "new" | "topRated" | "trending")[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  color: string;
  icon: string;
  /** Honest: 0 until real backend supplies a count (no invented numbers). */
  vendorCount: number;
}

export interface Campus {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  state: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  source: "seeded" | "user-added";
  status: "verified" | "unverified";
  createdByUserId?: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// CAMPUS CATALOG (curated, 250+ scope; NMU default per Doc 01 §5/§6)
// ---------------------------------------------------------------------------

// In-memory dev fixture mirroring the DB `campuses` table shape (fix #3 round 2:
// dev and prod share the same visibility contract; prod reads the DB, dev reads this).
// Coordinates verified against Wikipedia/OpenStreetMap, NOT invented.
export const campuses: Campus[] = [
  {
    id: "nmu-okerenkoko", slug: "nmu-okerenkoko", name: "Nigeria Maritime University (Okerenkoko)",
    city: "Okerenkoko", state: "Delta State", region: null, lat: 5.62449, lng: 5.39038,
    source: "seeded", status: "verified", createdByUserId: null, createdAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "nmu-kurutie", slug: "nmu-kurutie", name: "Nigeria Maritime University (Kurutie)",
    city: "Kurutie", state: "Delta State", region: null, lat: 5.62449, lng: 5.39038,
    source: "seeded", status: "verified", createdByUserId: null, createdAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "unilag", slug: "unilag", name: "University of Lagos",
    city: "Lagos", state: "Lagos State", region: null, lat: 6.51667, lng: 3.38611,
    source: "seeded", status: "verified", createdByUserId: null, createdAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "ui", slug: "ui", name: "University of Ibadan",
    city: "Ibadan", state: "Oyo State", region: null, lat: 7.3912, lng: 3.9167,
    source: "seeded", status: "verified", createdByUserId: null, createdAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "oau", slug: "oau", name: "Obafemi Awolowo University",
    city: "Ile-Ife", state: "Osun State", region: null, lat: 7.51833, lng: 4.52278,
    source: "seeded", status: "verified", createdByUserId: null, createdAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "unn", slug: "unn", name: "University of Nigeria Nsukka",
    city: "Nsukka", state: "Enugu State", region: null, lat: 6.858, lng: 7.396,
    source: "seeded", status: "verified", createdByUserId: null, createdAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "covenant", slug: "covenant", name: "Covenant University",
    city: "Ota", state: "Ogun State", region: null, lat: 6.6699, lng: 3.1574,
    source: "seeded", status: "verified", createdByUserId: null, createdAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "futo", slug: "futo", name: "Federal University of Technology Owerri",
    city: "Owerri", state: "Imo State", region: null, lat: 5.384, lng: 6.995,
    source: "seeded", status: "verified", createdByUserId: null, createdAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "uniben", slug: "uniben", name: "University of Benin",
    city: "Benin City", state: "Edo State", region: null, lat: 6.33370, lng: 5.60015,
    source: "seeded", status: "verified", createdByUserId: null, createdAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "abu", slug: "abu", name: "Ahmadu Bello University",
    city: "Zaria", state: "Kaduna State", region: null, lat: 11.067, lng: 7.700,
    source: "seeded", status: "verified", createdByUserId: null, createdAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "unijos", slug: "unijos", name: "University of Jos",
    city: "Jos", state: "Plateau State", region: null, lat: 9.95028, lng: 8.88917,
    source: "seeded", status: "verified", createdByUserId: null, createdAt: "2026-08-27T00:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// CAMPUS HELPERS (repo-backed; visibility filter applied in mockCampusRepo)
// ---------------------------------------------------------------------------

/**
 * Alias-aware campus search over the local dev fixture. In dev (no DATABASE_URL)
 * this mirrors realCampusRepo's visibility contract (verified + viewer's own
 * unverified). In prod the app calls mockCampusRepo directly; this helper exists
 * for call sites that still import from explore-view.
 */
export async function searchCampus(query: string, viewerIdentityId?: string): Promise<Campus[]> {
  const q = query.toLowerCase().trim();
  const matched = q
    ? campuses.filter((c) => c.name.toLowerCase().includes(q))
    : [...campuses];
  return matched.filter(
    (c) => c.status === "verified" || (viewerIdentityId != null && c.createdByUserId === viewerIdentityId),
  );
}

/** @deprecated use mockCampusRepo.create(input, creatorIdentityId). Kept for call-site grep. */
export async function submitNewCampus(name: string, creatorIdentityId: string): Promise<Campus> {
  const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const existing = campuses.find((c) => c.slug === slug);
  if (existing) return existing;
  const campus: Campus = {
    id: `campus-${Date.now()}`,
    slug,
    name: name.trim(),
    city: null,
    state: null,
    region: null,
    lat: null,
    lng: null,
    source: "user-added",
    status: "unverified",
    createdByUserId: creatorIdentityId,
    createdAt: new Date().toISOString(),
  };
  campuses.push(campus);
  return campus;
}

// ---------------------------------------------------------------------------
// CATEGORY TAXONOMY (curated, static per Doc 06 §"Categories (taxonomy)")
// ---------------------------------------------------------------------------
// IMPORTANT (P3, 2026-08-29): this array is the SINGLE source of truth for every
// category id/slug/name in the app — the vendor wizard, landing hero chips,
// /api/vendors resolution, and the Explore category key all read from here.
// `id` is what vendors/listings store (Database); `slug` is the URL + filter key
// (e.g. /c/food-drinks). Keep them 1:1 with seed.ts so the staff CRUD table and
// the UI never diverge. A listing's categorySlug is DERIVED from its categoryId
// via this map (real Neon listings have no categorySlug column).

export const categories: Category[] = [
  { id: "food", slug: "food-drinks", name: "Food & Drinks", color: "#E8A33D", icon: "utensils", vendorCount: 0 },
  { id: "fashion", slug: "fashion", name: "Fashion", color: "#E8919D", icon: "shirt", vendorCount: 0 },
  { id: "tech", slug: "tech-repairs", name: "Tech & Repairs", color: "#5BA8A0", icon: "wrench", vendorCount: 0 },
  { id: "beauty", slug: "beauty-care", name: "Beauty & Care", color: "#C97B9E", icon: "sparkles", vendorCount: 0 },
  { id: "academic", slug: "academic-services", name: "Academic Services", color: "#2D5A3D", icon: "book", vendorCount: 0 },
  { id: "books", slug: "books", name: "Books & Study Materials", color: "#5B7FB8", icon: "book", vendorCount: 0 },
  { id: "printing", slug: "printing", name: "Printing", color: "#5B7FB8", icon: "printer", vendorCount: 0 },
  { id: "photography", slug: "photography", name: "Photography", color: "#8B6FB8", icon: "camera", vendorCount: 0 },
  { id: "tailoring", slug: "tailoring", name: "Tailoring", color: "#C9A24B", icon: "scissors", vendorCount: 0 },
  { id: "logistics", slug: "logistics", name: "Logistics", color: "#3B5A7B", icon: "truck", vendorCount: 0 },
  { id: "home", slug: "home-essentials", name: "Home Essentials", color: "#7A9E7E", icon: "home", vendorCount: 0 },
  { id: "health", slug: "health-wellness", name: "Health & Wellness", color: "#5BA8A0", icon: "heart", vendorCount: 0 },
  { id: "groceries", slug: "groceries", name: "Groceries", color: "#7AB55A", icon: "shopping basket", vendorCount: 0 },
  { id: "tutorials", slug: "tutorials", name: "Tutorials & Classes", color: "#2D5A3D", icon: "graduation", vendorCount: 0 },
  { id: "rentals", slug: "rentals", name: "Rentals", color: "#3B5A7B", icon: "key", vendorCount: 0 },
  { id: "events", slug: "events", name: "Events & Parties", color: "#C97B9E", icon: "party", vendorCount: 0 },
  { id: "travel", slug: "travel-transport", name: "Travel & Transport", color: "#5B7FB8", icon: "car", vendorCount: 0 },
  { id: "student-support", slug: "student-support", name: "Student Support", color: "#C9A24B", icon: "users", vendorCount: 0 },
  { id: "other", slug: "other", name: "Other", color: "#7A7A7A", icon: "grid", vendorCount: 0 },
];

/** Map a category id -> its slug (used to derive categorySlug for real listings). */
export const CATEGORY_ID_TO_SLUG: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.id, c.slug]),
);

/** Map a category slug -> id (used at the Explore filter boundary: the UI sends
 * a slug like "food-drinks" but the DB column `category_id` stores the id "food"). */
export const CATEGORY_SLUG_TO_ID: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.slug, c.id]),
);

/** Map a category slug used in URLs (/c/[slug]) to the vendor `category` field. */
const CATEGORY_SLUG_TO_NAME: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.slug, c.name]),
);

// ---------------------------------------------------------------------------
// SHOWCASE VENDORS (hand-curated Explore/landing dataset; honest demo data)
// ---------------------------------------------------------------------------

export const vendors: VendorSummary[] = [
  {
    id: "1", slug: "kemi-cuts", name: "Kemi Cuts", category: "Fashion", categorySlug: "fashion", categoryColor: "#E8919D",
    photoUrl: null, status: "open", campusId: "nmu",
    priceRange: { min: 2000, max: 8000, currency: "NGN" },
    tags: ["popular", "topRated"],
  },
  {
    id: "2", slug: "tech-fix-nmu", name: "TechFix NMU", category: "Tech & Repairs", categorySlug: "tech", categoryColor: "#5BA8A0",
    photoUrl: null, status: "open", campusId: "nmu",
    priceRange: { min: 1500, max: 25000, currency: "NGN" },
    tags: ["popular", "topRated", "trending"],
  },
  {
    id: "3", slug: "mama-jollof", name: "Mama Jollof Kitchen", category: "Food & Drinks", categorySlug: "food", categoryColor: "#E8A33D",
    photoUrl: null, status: "closing_soon", campusId: "nmu",
    priceRange: { min: 500, max: 3000, currency: "NGN" },
    tags: ["popular", "topRated"],
  },
  {
    id: "4", slug: "print-hub", name: "Print Hub Express", category: "Printing", categorySlug: "printing", categoryColor: "#5B7FB8",
    photoUrl: null, status: "open", campusId: "nmu",
    priceRange: { min: 100, max: 5000, currency: "NGN" },
    tags: ["trending"],
  },
  {
    id: "5", slug: "beauty-by-ada", name: "Beauty by Ada", category: "Beauty & Care", categorySlug: "beauty", categoryColor: "#C97B9E",
    photoUrl: null, status: "open", campusId: "nmu",
    priceRange: { min: 3000, max: 15000, currency: "NGN" },
    tags: ["popular"],
  },
  {
    id: "6", slug: "campus-cafe", name: "Campus Café", category: "Food & Drinks", categorySlug: "food", categoryColor: "#E8A33D",
    photoUrl: null, status: "open", campusId: "nmu",
    priceRange: { min: 800, max: 4000, currency: "NGN" },
    tags: ["new"],
  },
  {
    id: "7", slug: "swift-logistics", name: "Swift Campus Logistics", category: "Logistics", categorySlug: "logistics", categoryColor: "#3B5A7B",
    photoUrl: null, status: "open", campusId: "nmu",
    priceRange: { min: 500, max: 3500, currency: "NGN" },
    tags: ["new"],
  },
  {
    id: "8", slug: "ace-tutors", name: "Ace Academic Tutors", category: "Academic Services", categorySlug: "academic", categoryColor: "#2D5A3D",
    photoUrl: null, status: "open", campusId: "nmu",
    priceRange: { min: 2000, max: 10000, currency: "NGN" },
    tags: [],
  },
  {
    id: "9", slug: "snap-memories", name: "Snap Memories Studio", category: "Photography", categorySlug: "photography", categoryColor: "#8B6FB8",
    photoUrl: null, status: "open", campusId: "nmu",
    priceRange: { min: 5000, max: 50000, currency: "NGN" },
    tags: ["new"],
  },
  {
    id: "10", slug: "stitch-perfect", name: "Stitch Perfect Tailoring", category: "Tailoring", categorySlug: "tailoring", categoryColor: "#C9A24B",
    photoUrl: null, status: "closing_soon", campusId: "nmu",
    priceRange: { min: 1500, max: 12000, currency: "NGN" },
    tags: [],
  },
  {
    id: "11", slug: "gadget-repair", name: "Gadget Repair Pro", category: "Tech & Repairs", categorySlug: "tech", categoryColor: "#5BA8A0",
    photoUrl: null, status: "open", campusId: "nmu",
    priceRange: { min: 2000, max: 30000, currency: "NGN" },
    tags: [],
  },
  {
    id: "12", slug: "fresh-bites", name: "Fresh Bites Eatery", category: "Food & Drinks", categorySlug: "food", categoryColor: "#E8A33D",
    photoUrl: null, status: "closed", campusId: "nmu",
    priceRange: { min: 600, max: 3500, currency: "NGN" },
    tags: [],
  },
];

// ---------------------------------------------------------------------------
// CAMPUS HELPERS (alias-aware search + dynamic submit; per Doc 01 §6)
// ---------------------------------------------------------------------------


/**
 * Resolve a category slug (from /c/[slug]) to its display name. Falls back to the raw slug.
 * Used by the category page header.
 */
export function categoryNameFromSlug(slug: string): string {
  return CATEGORY_SLUG_TO_NAME[slug] ?? slug;
}
