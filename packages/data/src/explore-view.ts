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
  rating: number;
  reviewCount: number;
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
  name: string;
  city: string;
  state: string;
  isDefault: boolean;
  status: "verified" | "unverified";
  aliases: string[];
  /** Honest: 0 until real backend supplies a count (no invented numbers). */
  vendorCount: number;
  /** Honest: null until real backend supplies a count (no invented numbers). */
  studentCount: number | null;
}

// ---------------------------------------------------------------------------
// CAMPUS CATALOG (curated, 250+ scope; NMU default per Doc 01 §5/§6)
// ---------------------------------------------------------------------------

export const campuses: Campus[] = [
  {
    id: "nmu",
    name: "Nigeria Maritime University",
    city: "Okerenkoko",
    state: "Delta State",
    isDefault: true,
    status: "verified",
    aliases: ["NMU", "Maritime"],
    vendorCount: 0,
    studentCount: null,
  },
  {
    id: "unilag",
    name: "University of Lagos",
    city: "Lagos",
    state: "Lagos State",
    isDefault: false,
    status: "verified",
    aliases: ["UNILAG"],
    vendorCount: 0,
    studentCount: null,
  },
  {
    id: "ui",
    name: "University of Ibadan",
    city: "Ibadan",
    state: "Oyo State",
    isDefault: false,
    status: "verified",
    aliases: ["UI"],
    vendorCount: 0,
    studentCount: null,
  },
  {
    id: "oau",
    name: "Obafemi Awolowo University",
    city: "Ile-Ife",
    state: "Osun State",
    isDefault: false,
    status: "verified",
    aliases: ["OAU"],
    vendorCount: 0,
    studentCount: null,
  },
  {
    id: "unn",
    name: "University of Nigeria Nsukka",
    city: "Nsukka",
    state: "Enugu State",
    isDefault: false,
    status: "verified",
    aliases: ["UNN"],
    vendorCount: 0,
    studentCount: null,
  },
  {
    id: "covenant",
    name: "Covenant University",
    city: "Ota",
    state: "Ogun State",
    isDefault: false,
    status: "verified",
    aliases: ["CU", "Covenant"],
    vendorCount: 0,
    studentCount: null,
  },
  {
    id: "futo",
    name: "Federal University of Technology Owerri",
    city: "Owerri",
    state: "Imo State",
    isDefault: false,
    status: "verified",
    aliases: ["FUTO"],
    vendorCount: 0,
    studentCount: null,
  },
  {
    id: "uniben",
    name: "University of Benin",
    city: "Benin City",
    state: "Edo State",
    isDefault: false,
    status: "verified",
    aliases: ["UNIBEN"],
    vendorCount: 0,
    studentCount: null,
  },
  {
    id: "abu",
    name: "Ahmadu Bello University",
    city: "Zaria",
    state: "Kaduna State",
    isDefault: false,
    status: "verified",
    aliases: ["ABU"],
    vendorCount: 0,
    studentCount: null,
  },
  {
    id: "unijos",
    name: "University of Jos",
    city: "Jos",
    state: "Plateau State",
    isDefault: false,
    status: "verified",
    aliases: ["UNIJOS"],
    vendorCount: 0,
    studentCount: null,
  },
];

// ---------------------------------------------------------------------------
// CATEGORY TAXONOMY (curated, static per Doc 06 §"Categories (taxonomy)")
// ---------------------------------------------------------------------------

export const categories: Category[] = [
  { id: "food", slug: "food-drinks", name: "Food & Drinks", color: "#E8A33D", icon: "utensils", vendorCount: 0 },
  { id: "fashion", slug: "fashion", name: "Fashion", color: "#E8919D", icon: "shirt", vendorCount: 0 },
  { id: "tech", slug: "tech-repairs", name: "Tech & Repairs", color: "#5BA8A0", icon: "wrench", vendorCount: 0 },
  { id: "beauty", slug: "beauty-care", name: "Beauty & Care", color: "#C97B9E", icon: "sparkles", vendorCount: 0 },
  { id: "academic", slug: "academic-services", name: "Academic Services", color: "#2D5A3D", icon: "book", vendorCount: 0 },
  { id: "printing", slug: "printing", name: "Printing", color: "#5B7FB8", icon: "printer", vendorCount: 0 },
  { id: "photography", slug: "photography", name: "Photography", color: "#8B6FB8", icon: "camera", vendorCount: 0 },
  { id: "tailoring", slug: "tailoring", name: "Tailoring", color: "#C9A24B", icon: "scissors", vendorCount: 0 },
  { id: "logistics", slug: "logistics", name: "Logistics", color: "#3B5A7B", icon: "truck", vendorCount: 0 },
  { id: "other", slug: "other", name: "Other", color: "#7A7A7A", icon: "grid", vendorCount: 0 },
];

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
    photoUrl: null, rating: 4.8, reviewCount: 24, status: "open", campusId: "nmu",
    priceRange: { min: 2000, max: 8000, currency: "NGN" },
    tags: ["popular", "topRated"],
  },
  {
    id: "2", slug: "tech-fix-nmu", name: "TechFix NMU", category: "Tech & Repairs", categorySlug: "tech", categoryColor: "#5BA8A0",
    photoUrl: null, rating: 4.9, reviewCount: 42, status: "open", campusId: "nmu",
    priceRange: { min: 1500, max: 25000, currency: "NGN" },
    tags: ["popular", "topRated", "trending"],
  },
  {
    id: "3", slug: "mama-jollof", name: "Mama Jollof Kitchen", category: "Food & Drinks", categorySlug: "food", categoryColor: "#E8A33D",
    photoUrl: null, rating: 4.7, reviewCount: 89, status: "closing_soon", campusId: "nmu",
    priceRange: { min: 500, max: 3000, currency: "NGN" },
    tags: ["popular", "topRated"],
  },
  {
    id: "4", slug: "print-hub", name: "Print Hub Express", category: "Printing", categorySlug: "printing", categoryColor: "#5B7FB8",
    photoUrl: null, rating: 4.6, reviewCount: 38, status: "open", campusId: "nmu",
    priceRange: { min: 100, max: 5000, currency: "NGN" },
    tags: ["trending"],
  },
  {
    id: "5", slug: "beauty-by-ada", name: "Beauty by Ada", category: "Beauty & Care", categorySlug: "beauty", categoryColor: "#C97B9E",
    photoUrl: null, rating: 4.9, reviewCount: 56, status: "open", campusId: "nmu",
    priceRange: { min: 3000, max: 15000, currency: "NGN" },
    tags: ["popular"],
  },
  {
    id: "6", slug: "campus-cafe", name: "Campus Café", category: "Food & Drinks", categorySlug: "food", categoryColor: "#E8A33D",
    photoUrl: null, rating: 4.5, reviewCount: 127, status: "open", campusId: "nmu",
    priceRange: { min: 800, max: 4000, currency: "NGN" },
    tags: ["new"],
  },
  {
    id: "7", slug: "swift-logistics", name: "Swift Campus Logistics", category: "Logistics", categorySlug: "logistics", categoryColor: "#3B5A7B",
    photoUrl: null, rating: 4.4, reviewCount: 31, status: "open", campusId: "nmu",
    priceRange: { min: 500, max: 3500, currency: "NGN" },
    tags: ["new"],
  },
  {
    id: "8", slug: "ace-tutors", name: "Ace Academic Tutors", category: "Academic Services", categorySlug: "academic", categoryColor: "#2D5A3D",
    photoUrl: null, rating: 4.8, reviewCount: 64, status: "open", campusId: "nmu",
    priceRange: { min: 2000, max: 10000, currency: "NGN" },
    tags: [],
  },
  {
    id: "9", slug: "snap-memories", name: "Snap Memories Studio", category: "Photography", categorySlug: "photography", categoryColor: "#8B6FB8",
    photoUrl: null, rating: 4.7, reviewCount: 45, status: "open", campusId: "nmu",
    priceRange: { min: 5000, max: 50000, currency: "NGN" },
    tags: ["new"],
  },
  {
    id: "10", slug: "stitch-perfect", name: "Stitch Perfect Tailoring", category: "Tailoring", categorySlug: "tailoring", categoryColor: "#C9A24B",
    photoUrl: null, rating: 4.6, reviewCount: 29, status: "closing_soon", campusId: "nmu",
    priceRange: { min: 1500, max: 12000, currency: "NGN" },
    tags: [],
  },
  {
    id: "11", slug: "gadget-repair", name: "Gadget Repair Pro", category: "Tech & Repairs", categorySlug: "tech", categoryColor: "#5BA8A0",
    photoUrl: null, rating: 4.5, reviewCount: 52, status: "open", campusId: "nmu",
    priceRange: { min: 2000, max: 30000, currency: "NGN" },
    tags: [],
  },
  {
    id: "12", slug: "fresh-bites", name: "Fresh Bites Eatery", category: "Food & Drinks", categorySlug: "food", categoryColor: "#E8A33D",
    photoUrl: null, rating: 4.3, reviewCount: 98, status: "closed", campusId: "nmu",
    priceRange: { min: 600, max: 3500, currency: "NGN" },
    tags: [],
  },
];

// ---------------------------------------------------------------------------
// CAMPUS HELPERS (alias-aware search + dynamic submit; per Doc 01 §6)
// ---------------------------------------------------------------------------

/**
 * Alias-aware campus search. Returns matches where the name or any alias contains the
 * query (normalized, case-insensitive). Synchronous wrapper over the curated catalog.
 * (Phase 9: backed by the dynamic campus store with auto-persist of unverified entries.)
 */
export async function searchCampus(query: string): Promise<Campus[]> {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return campuses;
  return campuses.filter(
    (c) => c.name.toLowerCase().includes(normalized) || c.aliases.some((a) => a.toLowerCase().includes(normalized)),
  );
}

/**
 * Submit a campus not in the catalog. Per Doc 01 §6 / Doc 03 IDN-010: auto-persists as
 * `unverified`, selectable immediately for the submitting user, publicly discoverable only
 * after ≥1 confirmed vendor, weekly founder review. Synchronous stub (Phase 9: persisted).
 */
export async function submitNewCampus(name: string): Promise<Campus> {
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    city: "Unknown",
    state: "Unknown",
    isDefault: false,
    status: "unverified",
    aliases: [],
    vendorCount: 0,
    studentCount: null,
  };
}

/**
 * Resolve a category slug (from /c/[slug]) to its display name. Falls back to the raw slug.
 * Used by the category page header.
 */
export function categoryNameFromSlug(slug: string): string {
  return CATEGORY_SLUG_TO_NAME[slug] ?? slug;
}
