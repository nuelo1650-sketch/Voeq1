/**
 * VS7.16/17/18 — Mock config repos: categories, campuses, agreements.
 * Categories/Campuses reuse the existing explore-view entities + arrays so admin
 * actions affect the real marketplace data. Agreements are new (VS7.18).
 * In-memory; swaps cleanly for real Postgres in Phase 9. No PII.
 */
import type { Agreement, AgreementRepo } from "./interfaces";
import { realCategoryRepo, realCampusRepo, realAgreementRepo } from "@voeq/db";
import type { Campus, Category } from "./explore-view";
import { campuses, categories } from "./explore-view";

export interface CategoryRepo {
  list(): Promise<Category[]>;
  create(input: { slug: string; name: string }): Promise<Category>;
  setActive(slug: string, isActive: boolean): Promise<Category | null>;
}

export interface CampusRepo {
  /** Verified campuses + (if viewerIdentityId provided) the viewer's own unverified campuses. */
  list(viewerIdentityId?: string): Promise<Campus[]>;
  /** Same visibility scope as list(); name/alias substring match. */
  searchByName(query: string, viewerIdentityId?: string): Promise<Campus[]>;
  /** Returns the campus if verified OR owned by viewerIdentityId; else null. */
  getBySlug(slug: string, viewerIdentityId?: string): Promise<Campus | null>;
  /** Create a user-added campus. Always owned by creatorIdentityId. */
  create(
    input: { name: string; slug?: string; city?: string | null; state?: string | null; lat?: number | null; lng?: number | null },
    creatorIdentityId: string,
  ): Promise<Campus>;
  /** Staff/admin: set verification status. */
  setStatus(slug: string, status: "verified" | "unverified", actorIdentityId: string): Promise<Campus | null>;
}

// ---- Categories (reuse explore-view `categories`) ----------------------------
const mockCategoryRepoImpl: CategoryRepo = {
  async list() {
    return [...categories];
  },
  async create(input) {
    const slug = input.slug.trim().toLowerCase();
    const existing = categories.find((c) => c.slug === slug);
    if (existing) return existing;
    const cat: Category = {
      id: `cat-${Date.now()}`,
      slug,
      name: input.name,
      color: "#888888",
      icon: "tag",
      vendorCount: 0,
    };
    categories.push(cat);
    return cat;
  },
  async setActive(slug, isActive) {
    const c = categories.find((x) => x.slug === slug);
    if (!c) return null;
    // P0: isActive is a first-class optional field on Category now.
    c.isActive = isActive;
    return c;
  },
};

// ---- Campuses (in-memory fixture mirror of realCampusRepo; dev parity) --------
function findBySlug(slugOrName: string): Campus | undefined {
  const q = slugOrName.trim().toLowerCase();
  return campuses.find((c) => c.slug.toLowerCase() === q || c.id.toLowerCase() === q || c.name.toLowerCase() === q);
}

/** Visibility filter: verified rows + (if viewer) viewer's own unverified rows. */
function visible(campusesIn: Campus[], viewerIdentityId?: string): Campus[] {
  return campusesIn.filter(
    (c) => c.status === "verified" || (viewerIdentityId != null && c.createdByUserId === viewerIdentityId),
  );
}

const mockCampusRepoImpl: CampusRepo = {
  async list(viewerIdentityId?: string) {
    return visible([...campuses], viewerIdentityId);
  },
  async searchByName(query: string, viewerIdentityId?: string) {
    const q = query.trim().toLowerCase();
    if (!q) return visible([...campuses], viewerIdentityId);
    const matched = campuses.filter(
      (c) => c.name.toLowerCase().includes(q),
    );
    return visible(matched, viewerIdentityId);
  },
  async getBySlug(slug: string, viewerIdentityId?: string) {
    const c = findBySlug(slug);
    if (!c) return null;
    if (c.status === "verified") return c;
    if (viewerIdentityId != null && c.createdByUserId === viewerIdentityId) return c;
    return null;
  },
  async create(input, creatorIdentityId: string) {
    const slug = (input.slug ?? input.name.trim().toLowerCase().replace(/\s+/g, "-")).replace(/[^a-z0-9-]/g, "");
    const existing = campuses.find((c) => c.slug === slug);
    if (existing) return existing;
    const now = new Date().toISOString();
    const campus: Campus = {
      id: `campus-${Date.now()}`,
      slug,
      name: input.name.trim(),
      city: input.city ?? null,
      state: input.state ?? null,
      region: null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      source: "user-added",
      status: "unverified",
      createdByUserId: creatorIdentityId,
      createdAt: now,
    };
    campuses.push(campus);
    return campus;
  },
  async setStatus(slug: string, status: "verified" | "unverified"): Promise<Campus | null> {
    const c = findBySlug(slug);
    if (!c) return null;
    c.status = status;
    return c;
  },
};

// ---- Agreements (new, VS7.18) ------------------------------------------------
const agreements: Agreement[] = [
  { id: "agr-terms-1", kind: "terms", version: "1.0", body: "Voeq Terms of Service v1.0.", effectiveAt: new Date().toISOString(), isCurrent: true },
  { id: "agr-privacy-1", kind: "privacy", version: "1.0", body: "Voeq Privacy Policy v1.0.", effectiveAt: new Date().toISOString(), isCurrent: true },
];

const mockAgreementRepoImpl: AgreementRepo = {
  async list(kind) {
    return kind ? agreements.filter((a) => a.kind === kind) : [...agreements];
  },
  async create(input) {
    const agr: Agreement = {
      id: `agr-${Date.now()}`, kind: input.kind, version: input.version, body: input.body,
      effectiveAt: new Date().toISOString(), isCurrent: false,
    };
    agreements.push(agr);
    return agr;
  },
  async setCurrent(id) {
    const target = agreements.find((a) => a.id === id);
    if (!target) return null;
    // P0: kind-scoped, matching realAgreementRepo — see repos.ts note.
    for (const a of agreements) if (a.kind === target.kind) a.isCurrent = a.id === id;
    return target;
  },
};

// D.2/D.3 — Factory (EOF): real Neon-backed repos when DATABASE_URL is set.
// P0 (config console): the `as unknown as` casts are GONE — realCategoryRepo
// was missing create/setActive and tsc couldn't see it (prod POST/PATCH would
// have 500'd). Every real repo is now directly typed against its interface;
// if a method is missing, typecheck fails at build time, not at runtime.
const USE_REAL = !!process.env.DATABASE_URL;
export const mockCategoryRepo: CategoryRepo = USE_REAL ? realCategoryRepo : mockCategoryRepoImpl;
export const mockCampusRepo: CampusRepo = USE_REAL ? realCampusRepo : mockCampusRepoImpl;
export const mockAgreementRepo: AgreementRepo = USE_REAL ? realAgreementRepo : mockAgreementRepoImpl;
