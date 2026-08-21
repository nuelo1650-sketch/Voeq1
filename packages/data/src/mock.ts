import type {
  ActivityRepo,
  AuthRepo,
  ListingsRepo,
  MessagesRepo,
  SearchRepo,
  StaffRepo,
  VendorsRepo,
  Listing,
  Vendor,
} from "./interfaces";

/**
 * Trivial in-memory mock. Returns shape-correct data. The EMPTY repos (activity/auth/
 * messages/staff) stay empty — no hardcoded vendors, no fake listings, no B.16 fixture
 * (Slice 4). The EXPLORE dataset below is a DELIBERATE, CLEARLY-LABELED dev/verification
 * dataset used only to populate the Explore grid + rails during the mock phase. It is
 * gated behind the mock path and MUST be replaced by a real ListingsRepo impl at Phase 9.
 * It never reaches production silently (same discipline as the Slice 1 activity seed).
 */

// ---- Explore dev dataset (NOT production data) ---------------------------------
// Each entry satisfies `Listing` (id/vendorId/title/priceMinor/isPublished/images) and
// carries EXTRA display fields that the real backend would provide. These extras live
// only in the mock layer; the `ExploreListing` view type in explore.ts consumes them.
export interface MockListingExtra {
  rating?: number;
  verified?: boolean;
  featured?: boolean;
  soldOut?: boolean;
  availability?: "open" | "closed" | "soon";
  categorySlug?: string;
  image?: string;
  trending?: boolean;
}

export const MOCK_EXPLORE_LISTINGS: (Listing & MockListingExtra)[] = [
  { id: "l1", vendorId: "v1", title: "Jollof & Plantain Bowl", priceMinor: 6500, isPublished: true, images: ["https://picsum.photos/seed/voeq1/400/300"], rating: 4.8, verified: true, featured: true, availability: "open", categorySlug: "food", trending: true },
  { id: "l2", vendorId: "v2", title: "Campus Textbook Bundle", priceMinor: 12000, isPublished: true, images: ["https://picsum.photos/seed/voeq2/400/300"], rating: 4.5, verified: true, availability: "open", categorySlug: "books" },
  { id: "l3", vendorId: "v3", title: "Braided Hair Styling", priceMinor: 9000, isPublished: true, images: [], rating: 4.9, verified: false, availability: "open", categorySlug: "beauty", trending: true },
  { id: "l4", vendorId: "v1", title: "Suya Skewers (10)", priceMinor: 4000, isPublished: true, images: ["https://picsum.photos/seed/voeq4/400/300"], rating: 4.6, verified: true, soldOut: true, availability: "closed", categorySlug: "food" },
  { id: "l5", vendorId: "v4", title: "Printed Hoodie (NMU)", priceMinor: 15000, isPublished: true, images: ["https://picsum.photos/seed/voeq5/400/300"], rating: 4.3, verified: true, featured: true, availability: "soon", categorySlug: "apparel" },
  { id: "l6", vendorId: "v5", title: "Tutoring — Calculus", priceMinor: 8000, isPublished: true, images: [], rating: 5.0, verified: true, availability: "open", categorySlug: "services" },
  { id: "l7", vendorId: "v2", title: "Used Calculus Textbook", priceMinor: 5500, isPublished: true, images: ["https://picsum.photos/seed/voeq7/400/300"], rating: 4.1, verified: false, availability: "open", categorySlug: "books" },
  { id: "l8", vendorId: "v3", title: "Nail Art Set", priceMinor: 7000, isPublished: true, images: ["https://picsum.photos/seed/voeq8/400/300"], rating: 4.7, verified: true, availability: "open", categorySlug: "beauty" },
  { id: "l9", vendorId: "v6", title: "Phone Repair (screen)", priceMinor: 11000, isPublished: true, images: [], rating: 4.4, verified: true, featured: true, availability: "open", categorySlug: "services", trending: true },
  { id: "l10", vendorId: "v4", title: "Custom Tote Bag", priceMinor: 5000, isPublished: true, images: ["https://picsum.photos/seed/voeq10/400/300"], rating: 4.2, verified: false, availability: "open", categorySlug: "apparel" },
  { id: "l11", vendorId: "v5", title: "Group Study Notes — Physics", priceMinor: 3000, isPublished: true, images: [], rating: 4.0, verified: true, availability: "open", categorySlug: "books" },
  { id: "l12", vendorId: "v6", title: "Campus Snack Pack", priceMinor: 4500, isPublished: true, images: ["https://picsum.photos/seed/voeq12/400/300"], rating: 4.6, verified: true, availability: "open", categorySlug: "food" },

  // --- C.6 / B.16 stress fixture: 13 additional listings for v1 (Mama Nkechi) ---
  // Brings v1 from 2 -> 15 listings to prove the storefront grid holds up under
  // stress without card monotony. Varied title length, price spread, availability
  // mix (open/soon/closed), ratings, verified/featured flags. No description field
  // exists on the data model, so visual variety comes from title/price/availability.
  // NOTE: IDs l5-l12 are taken by other vendors; these use l13-l25 to avoid collision.
  { id: "l13", vendorId: "v1", title: "Akara Plate", priceMinor: 1200, isPublished: true, images: ["https://picsum.photos/seed/voeq13/400/400"], rating: 4.5, verified: true, availability: "open", categorySlug: "food" },
  { id: "l14", vendorId: "v1", title: "Meat Pie", priceMinor: 800, isPublished: true, images: ["https://picsum.photos/seed/voeq14/400/560"], rating: 4.3, verified: true, availability: "open", categorySlug: "food" },
  { id: "l15", vendorId: "v1", title: "Chin Chin", priceMinor: 500, isPublished: true, images: ["https://picsum.photos/seed/voeq15/560/400"], rating: 4.1, verified: false, availability: "open", categorySlug: "food" },
  { id: "l16", vendorId: "v1", title: "Spicy Jollof Rice Bowl", priceMinor: 3800, isPublished: true, images: ["https://picsum.photos/seed/voeq16/560/400"], rating: 4.7, verified: true, featured: true, availability: "open", categorySlug: "food" },
  { id: "l17", vendorId: "v1", title: "Fried Yam with Egg", priceMinor: 2500, isPublished: true, images: ["https://picsum.photos/seed/voeq17/400/400"], rating: 4.4, verified: true, availability: "open", categorySlug: "food" },
  { id: "l18", vendorId: "v1", title: "Pepper Soup Combo", priceMinor: 4900, isPublished: true, images: ["https://picsum.photos/seed/voeq18/400/560"], rating: 4.6, verified: true, availability: "soon", categorySlug: "food" },
  { id: "l19", vendorId: "v1", title: "Plantain and Beans", priceMinor: 2200, isPublished: true, images: ["https://picsum.photos/seed/voeq19/560/400"], rating: 4.2, verified: false, availability: "open", categorySlug: "food" },
  { id: "l20", vendorId: "v1", title: "Grilled Fish Platter", priceMinor: 6500, isPublished: true, images: ["https://picsum.photos/seed/voeq20/560/400"], rating: 4.8, verified: true, featured: true, availability: "open", categorySlug: "food" },
  { id: "l21", vendorId: "v1", title: "Homemade Moi Moi with Custard", priceMinor: 3100, isPublished: true, images: ["https://picsum.photos/seed/voeq21/400/400"], rating: 4.5, verified: true, availability: "soon", categorySlug: "food" },
  { id: "l22", vendorId: "v1", title: "Party Jollof Catering for Events", priceMinor: 22500, isPublished: true, images: ["https://picsum.photos/seed/voeq22/400/560"], rating: 4.9, verified: true, featured: true, trending: true, availability: "soon", categorySlug: "services" },
  { id: "l23", vendorId: "v1", title: "Fresh Okra Soup with Assorted Meat", priceMinor: 5500, isPublished: true, images: ["https://picsum.photos/seed/voeq23/560/400"], rating: 4.6, verified: true, availability: "open", categorySlug: "food" },
  { id: "l24", vendorId: "v1", title: "Breakfast Semo and Egusi Combo", priceMinor: 4500, isPublished: true, images: ["https://picsum.photos/seed/voeq24/560/400"], rating: 4.3, verified: false, soldOut: true, availability: "closed", categorySlug: "food" },
  { id: "l25", vendorId: "v1", title: "Small Chops Platter for Celebrations", priceMinor: 8500, isPublished: true, images: ["https://picsum.photos/seed/voeq25/560/400"], rating: 4.7, verified: true, soldOut: true, availability: "closed", categorySlug: "food" },
];

export const MOCK_VENDORS: Vendor[] = [
  { id: "v1", name: "Mama Nkechi Kitchen", handle: "mama-nkechi", campus: "nmu", categoryIds: ["food"] },
  { id: "v2", name: "Campus Books", handle: "campus-books", campus: "nmu", categoryIds: ["books"] },
  { id: "v3", name: "Glam by Zee", handle: "glam-by-zee", campus: "nmu", categoryIds: ["beauty"] },
  { id: "v4", name: "NMU Threads", handle: "nmu-threads", campus: "nmu", categoryIds: ["apparel"] },
  { id: "v5", name: "Bright Minds Tutors", handle: "bright-minds", campus: "nmu", categoryIds: ["services", "books"] },
  { id: "v6", name: "FixIT Campus", handle: "fixit-campus", campus: "nmu", categoryIds: ["services"] },
];

const vendorName = (id: string) => MOCK_VENDORS.find((v) => v.id === id)?.name ?? "Vendor";

// ---- Repos ---------------------------------------------------------------------
export const mockListingsRepo: ListingsRepo = {
  async list(params?: { campus?: string; category?: string }) {
    // Mock: ignore campus (all sample data is "nmu"); filter by category if given.
    const cat = params?.category;
    return cat ? MOCK_EXPLORE_LISTINGS.filter((l) => l.categorySlug === cat) : MOCK_EXPLORE_LISTINGS;
  },
  async getById(id: string) {
    return MOCK_EXPLORE_LISTINGS.find((l) => l.id === id) ?? null;
  },
};

/** Forces a failure — used by the Explore error/retry e2e path via ?exploreError=1. */
export const mockListingsRepoThatFails: ListingsRepo = {
  async list() {
    throw new Error("Simulated listings fetch failure (mock)");
  },
  async getById() {
    return null;
  },
};

export const mockVendorsRepo: VendorsRepo = {
  async listVendors() {
    return MOCK_VENDORS;
  },
  async getById(id: string) {
    return MOCK_VENDORS.find((v) => v.id === id) ?? null;
  },
};

export const mockActivityRepo: ActivityRepo = {
  async recent() {
    return [];
  },
};

// mockAuthRepo lives in auth.ts (full Identity & Access impl, VS2).

export const mockMessagesRepo: MessagesRepo = {
  async listConversations() {
    return [];
  },
};

export const mockStaffRepo: StaffRepo = {
  async listCases() {
    return [];
  },
};

export const mockSearchRepo: SearchRepo = {
  async search(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return MOCK_EXPLORE_LISTINGS.filter((l) => l.title.toLowerCase().includes(q));
  },
};

export const mockRepos = {
  listings: mockListingsRepo,
  vendors: mockVendorsRepo,
  activity: mockActivityRepo,
  messages: mockMessagesRepo,
  staff: mockStaffRepo,
  search: mockSearchRepo,
};

/** Mock-only: a vendor's listings, filtered from the dev explore dataset. */
export const listListingsByVendor = (vendorId: string): (Listing & MockListingExtra)[] =>
  MOCK_EXPLORE_LISTINGS.filter((l) => l.vendorId === vendorId);

export { vendorName };
