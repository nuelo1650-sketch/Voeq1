import type {
  ActivityRepo,
  AuthRepo,
  ListingsRepo,
  MessagesRepo,
  SearchRepo,
  StaffRepo,
  StaffCase,
  VendorsRepo,
  VendorRepo,
  Listing,
  Vendor,
} from "./interfaces";
import { realListingsRepo, realVendorRepo, realActivityRepo, realMessageRepo, realStaffRepo } from "@voeq/db";

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
  verified?: boolean;
  featured?: boolean;
  soldOut?: boolean;
  availability?: "open" | "closed" | "soon";
  categorySlug?: string;
  image?: string;
  trending?: boolean;
}

export const MOCK_EXPLORE_LISTINGS: (Listing & MockListingExtra)[] = [
  { id: "l1", vendorId: "v1", title: "Jollof & Plantain Bowl", priceMinor: 6500, priceMinMinor: 6500, priceMaxMinor: null, categoryId: "food", description: "Classic campus jollof with fried plantain.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq1/400/300"], verified: true, featured: true, availability: "open", categorySlug: "food", trending: true },
  { id: "l2", vendorId: "v2", title: "Campus Textbook Bundle", priceMinor: 12000, priceMinMinor: 12000, priceMaxMinor: null, categoryId: "books", description: "Core semester textbooks bundled.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq2/400/300"], verified: true, availability: "open", categorySlug: "books" },
  { id: "l3", vendorId: "v3", title: "Braided Hair Styling", priceMinor: 9000, priceMinMinor: 9000, priceMaxMinor: null, categoryId: "beauty", description: "Box braids and twists.", isPublished: true, status: "active", isFeatured: false, images: [], verified: false, availability: "open", categorySlug: "beauty", trending: true },
  { id: "l4", vendorId: "v1", title: "Suya Skewers (10)", priceMinor: 4000, priceMinMinor: 4000, priceMaxMinor: null, categoryId: "food", description: "Char-grilled beef suya.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq4/400/300"], verified: true, soldOut: true, availability: "closed", categorySlug: "food" },
  { id: "l5", vendorId: "v4", title: "Printed Hoodie (NMU)", priceMinor: 15000, priceMinMinor: 15000, priceMaxMinor: null, categoryId: "apparel", description: "Custom NMU hoodie.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq5/400/300"], verified: true, featured: true, availability: "soon", categorySlug: "apparel" },
  { id: "l6", vendorId: "v5", title: "Tutoring — Calculus", priceMinor: 8000, priceMinMinor: 8000, priceMaxMinor: null, categoryId: "services", description: "One-on-one calculus help.", isPublished: true, status: "active", isFeatured: false, images: [], verified: true, availability: "open", categorySlug: "services" },
  { id: "l7", vendorId: "v2", title: "Used Calculus Textbook", priceMinor: 5500, priceMinMinor: 5500, priceMaxMinor: null, categoryId: "books", description: "Pre-owned calculus text.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq7/400/300"], verified: false, availability: "open", categorySlug: "books" },
  { id: "l8", vendorId: "v3", title: "Nail Art Set", priceMinor: 7000, priceMinMinor: 7000, priceMaxMinor: null, categoryId: "beauty", description: "Manicure and nail art.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq8/400/300"], verified: true, availability: "open", categorySlug: "beauty" },
  { id: "l9", vendorId: "v6", title: "Phone Repair (screen)", priceMinor: 11000, priceMinMinor: 11000, priceMaxMinor: null, categoryId: "services", description: "Screen replacement.", isPublished: true, status: "active", isFeatured: false, images: [], verified: true, featured: true, availability: "open", categorySlug: "services", trending: true },
  { id: "l10", vendorId: "v4", title: "Custom Tote Bag", priceMinor: 5000, priceMinMinor: 5000, priceMaxMinor: null, categoryId: "apparel", description: "Canvas tote, custom print.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq10/400/300"], verified: false, availability: "open", categorySlug: "apparel" },
  { id: "l11", vendorId: "v5", title: "Group Study Notes — Physics", priceMinor: 3000, priceMinMinor: 3000, priceMaxMinor: null, categoryId: "services", description: "Condensed physics notes.", isPublished: true, status: "active", isFeatured: false, images: [], verified: true, availability: "open", categorySlug: "books" },
  { id: "l12", vendorId: "v6", title: "Campus Snack Pack", priceMinor: 4500, priceMinMinor: 4500, priceMaxMinor: null, categoryId: "services", description: "Assorted snacks.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq12/400/300"], verified: true, availability: "open", categorySlug: "food" },

  // --- C.6 / B.16 stress fixture: 13 additional listings for v1 (Mama Nkechi) ---
  { id: "l13", vendorId: "v1", title: "Akara Plate", priceMinor: 1200, priceMinMinor: 1200, priceMaxMinor: null, categoryId: "food", description: "Bean cakes.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq13/400/400"], verified: true, availability: "open", categorySlug: "food" },
  { id: "l14", vendorId: "v1", title: "Meat Pie", priceMinor: 800, priceMinMinor: 800, priceMaxMinor: null, categoryId: "food", description: "Baked meat pie.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq14/400/560"], verified: true, availability: "open", categorySlug: "food" },
  { id: "l15", vendorId: "v1", title: "Chin Chin", priceMinor: 500, priceMinMinor: 500, priceMaxMinor: null, categoryId: "food", description: "Crunchy fried snack.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq15/560/400"], verified: false, availability: "open", categorySlug: "food" },
  { id: "l16", vendorId: "v1", title: "Spicy Jollof Rice Bowl", priceMinor: 3800, priceMinMinor: 3800, priceMaxMinor: null, categoryId: "food", description: "Jollof with extra pepper.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq16/560/400"], verified: true, featured: true, availability: "open", categorySlug: "food" },
  { id: "l17", vendorId: "v1", title: "Fried Yam with Egg", priceMinor: 2500, priceMinMinor: 2500, priceMaxMinor: null, categoryId: "food", description: "Yam and fried egg.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq17/400/400"], verified: true, availability: "open", categorySlug: "food" },
  { id: "l18", vendorId: "v1", title: "Pepper Soup Combo", priceMinor: 4900, priceMinMinor: 4900, priceMaxMinor: null, categoryId: "food", description: "Spicy pepper soup.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq18/400/560"], verified: true, availability: "soon", categorySlug: "food" },
  { id: "l19", vendorId: "v1", title: "Plantain and Beans", priceMinor: 2200, priceMinMinor: 2200, priceMaxMinor: null, categoryId: "food", description: "Beans and fried plantain.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq19/560/400"], verified: false, availability: "open", categorySlug: "food" },
  { id: "l20", vendorId: "v1", title: "Grilled Fish Platter", priceMinor: 6500, priceMinMinor: 6500, priceMaxMinor: null, categoryId: "food", description: "Grilled fish plate.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq20/560/400"], verified: true, featured: true, availability: "open", categorySlug: "food" },
  { id: "l21", vendorId: "v1", title: "Homemade Moi Moi with Custard", priceMinor: 3100, priceMinMinor: 3100, priceMaxMinor: null, categoryId: "food", description: "Steamed bean pudding.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq21/400/400"], verified: true, availability: "soon", categorySlug: "food" },
  { id: "l22", vendorId: "v1", title: "Party Jollof Catering for Events", priceMinor: 22500, priceMinMinor: 22500, priceMaxMinor: null, categoryId: "services", description: "Bulk catering.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq22/400/560"], verified: true, featured: true, trending: true, availability: "soon", categorySlug: "services" },
  { id: "l23", vendorId: "v1", title: "Fresh Okra Soup with Assorted Meat", priceMinor: 5500, priceMinMinor: 5500, priceMaxMinor: null, categoryId: "food", description: "Okra soup.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq23/560/400"], verified: true, availability: "open", categorySlug: "food" },
  { id: "l24", vendorId: "v1", title: "Breakfast Semo and Egusi Combo", priceMinor: 4500, priceMinMinor: 4500, priceMaxMinor: null, categoryId: "food", description: "Semo and egusi.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq24/560/400"], verified: false, soldOut: true, availability: "closed", categorySlug: "food" },
  { id: "l25", vendorId: "v1", title: "Small Chops Platter for Celebrations", priceMinor: 8500, priceMinMinor: 8500, priceMaxMinor: null, categoryId: "food", description: "Party small chops.", isPublished: true, status: "active", isFeatured: false, images: ["https://picsum.photos/seed/voeq25/560/400"], verified: true, soldOut: true, availability: "closed", categorySlug: "food" },
];

export const MOCK_VENDORS: Vendor[] = [
  { id: "v1", name: "Mama Nkechi Kitchen", handle: "mama-nkechi", campus: "nmu", categoryIds: ["food"], status: "live", verified: true, description: "Home-style Nigerian meals prepared fresh daily on campus.", subArea: null, profilePhotoUrl: null, agreementVersion: "2026-08-01", agreementAcceptedAt: "2026-08-01T00:00:00.000Z", identityId: null, slug: "mama-nkechi" },
  { id: "v2", name: "Campus Books", handle: "campus-books", campus: "nmu", categoryIds: ["books"], status: "live", verified: true, description: "New and used textbooks for every faculty.", subArea: null, profilePhotoUrl: null, agreementVersion: "2026-08-01", agreementAcceptedAt: "2026-08-01T00:00:00.000Z", identityId: null, slug: "campus-books" },
  { id: "v3", name: "Glam by Zee", handle: "glam-by-zee", campus: "nmu", categoryIds: ["beauty"], status: "live", verified: true, description: "Braids, wigs and styling for campus events.", subArea: null, profilePhotoUrl: null, agreementVersion: "2026-08-01", agreementAcceptedAt: "2026-08-01T00:00:00.000Z", identityId: null, slug: "glam-by-zee" },
  { id: "v4", name: "NMU Threads", handle: "nmu-threads", campus: "nmu", categoryIds: ["apparel"], status: "live", verified: true, description: "Custom tees and hoodies with campus flair.", subArea: null, profilePhotoUrl: null, agreementVersion: "2026-08-01", agreementAcceptedAt: "2026-08-01T00:00:00.000Z", identityId: null, slug: "nmu-threads" },
  { id: "v5", name: "Bright Minds Tutors", handle: "bright-minds", campus: "nmu", categoryIds: ["services", "books"], status: "live", verified: true, description: "Peer tutoring across STEM and the humanities.", subArea: null, profilePhotoUrl: null, agreementVersion: "2026-08-01", agreementAcceptedAt: "2026-08-01T00:00:00.000Z", identityId: null, slug: "bright-minds" },
  { id: "v6", name: "FixIT Campus", handle: "fixit-campus", campus: "nmu", categoryIds: ["services"], status: "live", verified: true, description: "Phone, laptop and gadget repairs on campus.", subArea: null, profilePhotoUrl: null, agreementVersion: "2026-08-01", agreementAcceptedAt: "2026-08-01T00:00:00.000Z", identityId: null, slug: "fixit-campus" },
];

const vendorName = (id: string) => MOCK_VENDORS.find((v) => v.id === id)?.name ?? "Vendor";

// ---- Repos ---------------------------------------------------------------------
const mockListingsRepoImpl: ListingsRepo = {
  async list(params?: { campus?: string; category?: string; publicOnly?: boolean }) {
    // Mock: ignore campus (all sample data is "nmu"); filter by category if given.
    const cat = params?.category;
    let base = cat ? MOCK_EXPLORE_LISTINGS.filter((l) => l.categorySlug === cat) : MOCK_EXPLORE_LISTINGS;
    // P-A round 69: publicOnly parity with the real repo (published+active+live).
    if (params?.publicOnly) {
      const liveVendorIds = MOCK_VENDORS.filter((v) => v.status === "live").map((v) => v.id);
      base = base.filter((l) => l.isPublished !== false && l.status !== "removed" && liveVendorIds.includes(l.vendorId));
    }
    return base;
  },
  async getById(id: string) {
    return MOCK_EXPLORE_LISTINGS.find((l) => l.id === id) ?? null;
  },
  async create(input) {
    const listing: Listing & MockListingExtra = {
      id: input.id ?? `l-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      vendorId: input.vendorId,
      title: input.title,
      priceMinor: input.priceMinMinor,
      priceMinMinor: input.priceMinMinor,
      priceMaxMinor: input.priceMaxMinor ?? null,
      categoryId: input.categoryId,
      description: input.description ?? null,
      isPublished: input.isPublished ?? true,
      status: input.status ?? "active",
      isFeatured: false,
      featuredUntil: null,
      images: input.images ?? [],
      // mock extras
      verified: false,
      availability: "open",
      categorySlug: input.categoryId,
    };
    MOCK_EXPLORE_LISTINGS.push(listing);
    return listing;
  },
  async remove(id: string) {
    const idx = MOCK_EXPLORE_LISTINGS.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    MOCK_EXPLORE_LISTINGS.splice(idx, 1);
    return true;
  },
  async update(id: string, patch: Partial<Listing>) {
    const l = MOCK_EXPLORE_LISTINGS.find((x) => x.id === id);
    if (!l) return null;
    Object.assign(l, patch);
    return l;
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
  async create() {
    throw new Error("Simulated listings create failure (mock)");
  },
  async update() {
    throw new Error("Simulated listings update failure (mock)");
  },
  async remove() {
    throw new Error("Simulated listings remove failure (mock)");
  },
};

const mockVendorRepoImpl: VendorRepo = {
  async listVendors(params?) {
    // P-A round 69: publicOnly filters to live vendors in mock mode too
    // (parity with the real repo).
    if (params?.publicOnly) return MOCK_VENDORS.filter((v) => v.status === "live");
    return MOCK_VENDORS;
  },
  async getById(id) {
    return MOCK_VENDORS.find((v) => v.id === id) ?? null;
  },
  async getByIdentityId(identityId) {
    return MOCK_VENDORS.find((v) => v.identityId === identityId) ?? null;
  },
  async create(input) {
    const vendor: Vendor = {
      id: input.id ?? `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: input.name,
      handle: input.handle ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      campus: input.campus,
      categoryIds: input.categoryIds,
      status: input.status ?? "pending_listings",
      verified: input.verified ?? false,
      description: input.description ?? "",
      subArea: input.subArea ?? null,
      profilePhotoUrl: input.profilePhotoUrl ?? null,
      agreementVersion: input.agreementVersion ?? null,
      agreementAcceptedAt: input.agreementAcceptedAt ?? null,
      identityId: input.identityId,
      slug: input.slug ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    };
    MOCK_VENDORS.push(vendor);
    return vendor;
  },
  async patch(id, patch) {
    const v = MOCK_VENDORS.find((x) => x.id === id);
    if (!v) return null;
    Object.assign(v, patch);
    return v;
  },
};

const mockActivityRepoImpl: ActivityRepo = {
  async recent() {
    return [];
  },
};

// mockAuthRepo lives in auth.ts (full Identity & Access impl, VS2).

const mockMessagesRepoImpl: MessagesRepo = {
  async listConversations() {
    return [];
  },
  async listAll() {
    return [];
  },
};

const staffCases: StaffCase[] = [];

const mockStaffRepoImpl: StaffRepo = {
  async create(input) {
    const c: StaffCase = {
      id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "open",
      assignedTo: null,
      resolution: null,
      ...input,
    };
    staffCases.push(c);
    return c;
  },
  async listCases(queue) {
    // P-A round 57: "" means ALL (mirrors real repo fix — C1).
    return queue ? staffCases.filter((c) => c.queue === queue) : staffCases;
  },
  async assignCase(caseId, assignedTo) {
    const c = staffCases.find((x) => x.id === caseId);
    if (!c) return null;
    c.assignedTo = assignedTo;
    if (c.status === "open") c.status = "triaged";
    return c;
  },
  async resolveCase(caseId, resolution, status = "resolved") {
    const c = staffCases.find((x) => x.id === caseId);
    if (!c) return null;
    c.resolution = resolution;
    c.status = status;
    return c;
  },
  async patchCasePayload(caseId, patch) {
    const c = staffCases.find((x) => x.id === caseId);
    if (!c) return null;
    c.payload = { ...(c.payload ?? {}), ...patch };
    return c;
  },
  async reopenCase(caseId) {
    const c = staffCases.find((x) => x.id === caseId);
    if (!c) return null;
    c.status = "open";
    c.resolution = null;
    return c;
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
  listings: mockListingsRepoImpl,
  vendors: mockVendorRepoImpl,
  activity: mockActivityRepoImpl,
  messages: mockMessagesRepoImpl,
  staff: mockStaffRepoImpl,
  search: mockSearchRepo,
};

/** Mock-only: a vendor's listings, filtered from the dev explore dataset. */
export const listListingsByVendor = (vendorId: string): (Listing & MockListingExtra)[] =>
  MOCK_EXPLORE_LISTINGS.filter((l) => l.vendorId === vendorId);

export { vendorName };

// D.2/D.3 — Factory (EOF): real Neon-backed repos when DATABASE_URL is set.
const USE_REAL = !!process.env.DATABASE_URL;
export const mockListingsRepo: ListingsRepo = USE_REAL ? realListingsRepo : mockListingsRepoImpl;
export const mockVendorRepo: VendorRepo = USE_REAL ? realVendorRepo : mockVendorRepoImpl;
export const mockActivityRepo: ActivityRepo = USE_REAL ? realActivityRepo : mockActivityRepoImpl;
export const mockMessagesRepo: MessagesRepo = USE_REAL ? realMessageRepo : mockMessagesRepoImpl;
export const mockStaffRepo: StaffRepo = USE_REAL ? realStaffRepo : mockStaffRepoImpl;
