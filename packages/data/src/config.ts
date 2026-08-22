/**
 * VS7.16/17/18 — Mock config repos: categories, campuses, agreements.
 * Categories/Campuses reuse the existing explore-view entities + arrays so admin
 * actions affect the real marketplace data. Agreements are new (VS7.18).
 * In-memory; swaps cleanly for real Postgres in Phase 9. No PII.
 */
import type { Agreement, AgreementRepo } from "./interfaces";
import type { Campus, Category } from "./explore-view";
import { campuses, categories, submitNewCampus } from "./explore-view";

export interface CategoryRepo {
  list(): Promise<Category[]>;
  create(input: { slug: string; name: string }): Promise<Category>;
  setActive(slug: string, isActive: boolean): Promise<Category | null>;
}

export interface CampusRepo {
  list(): Promise<Campus[]>;
  create(input: { slug: string; name: string }): Promise<Campus>;
  verify(slug: string, isVerified: boolean): Promise<Campus | null>;
  promote(slug: string): Promise<Campus | null>;
}

// ---- Categories (reuse explore-view `categories`) ----------------------------
export const mockCategoryRepo: CategoryRepo = {
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
    (c as Category & { isActive?: boolean }).isActive = isActive;
    return c;
  },
};

// ---- Campuses (reuse explore-view `campuses`, status field) ------------------
function findBySlug(slugOrName: string): Campus | undefined {
  const q = slugOrName.trim().toLowerCase();
  return campuses.find((c) => c.id.toLowerCase() === q || c.name.toLowerCase() === q);
}

export const mockCampusRepo: CampusRepo = {
  async list() {
    return [...campuses];
  },
  async create(input) {
    return submitNewCampus(input.name.trim());
  },
  async verify(slug, isVerified) {
    const c = findBySlug(slug);
    if (!c) return null;
    c.status = isVerified ? "verified" : "unverified";
    return c;
  },
  async promote(slug) {
    const c = findBySlug(slug);
    if (!c) return null;
    c.status = "verified";
    return c;
  },
};

// ---- Agreements (new, VS7.18) ------------------------------------------------
const agreements: Agreement[] = [
  { id: "agr-terms-1", kind: "terms", version: "1.0", body: "Voeq Terms of Service v1.0.", effectiveAt: new Date().toISOString(), isCurrent: true },
  { id: "agr-privacy-1", kind: "privacy", version: "1.0", body: "Voeq Privacy Policy v1.0.", effectiveAt: new Date().toISOString(), isCurrent: true },
];

export const mockAgreementRepo: AgreementRepo = {
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
    for (const a of agreements) a.isCurrent = a.id === id;
    return target;
  },
};
