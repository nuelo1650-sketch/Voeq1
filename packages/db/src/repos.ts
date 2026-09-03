/**
 * D.2/D.3 — Real repository implementations backed by Neon/Drizzle.
 * Fulfill the packages/data/src/interfaces.ts contracts. Activated by the
 * factory (packages/data/src/real.ts) when DATABASE_URL is present.
 *
 * Every method mirrors the mock signature exactly so callers (routes) don't
 * change. ID generation uses crypto.randomUUID; timestamps are ISO strings
 * (matching the mock layer's convention).
 */
import { randomUUID } from "crypto";
import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./client";
import * as s from "./schema";
import type {
  Identity,
  Session,
  PendingToken,
  ConsentAcceptance,
  AccountStatus,
  AuthMethod,
  OtpPurpose,
  UserRole,
  UserPreference,
  AuditEntry,
  Vendor,
  Listing,
  Review,
  Conversation,
  Message,
  MessageState,
  StaffCase,
  WishlistItem,
  Follow,
  Like,
  Comment,
  Report,
  ReportCategory,
  Notification,
  NotificationPref,
  NotificationType,
  Agreement,
  FeatureFlag,
  Campus,
  CampusRepo,
} from "@voeq/data";

const now = () => new Date().toISOString();
const id = () => randomUUID();

function mapIdentity(r: typeof s.identities.$inferSelect): Identity {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    passwordHash: r.passwordHash ?? null,
    googleSubject: r.googleSubject ?? null,
    method: r.method,
    role: r.role,
    staffRole: (r.staffRole as Identity["staffRole"]) ?? null,
    intent: (r.intent as "shopper" | "vendor" | null) ?? null,
    accountStatus: r.accountStatus,
    emailVerified: r.emailVerified,
    campus: r.campus ?? null,
    consent: r.consent ?? [],
    vendorId: r.vendorId ?? null,
    avatarUrl: r.avatarUrl ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

// ---- IdentityRepo -----------------------------------------------------------
export const realIdentityRepo = {
  async createPending(input: {
    email: string;
    name: string;
    passwordHash: string | null;
    method: AuthMethod;
    intent: "shopper" | "vendor" | null;
    googleSubject?: string | null;
  }): Promise<Identity> {
    const t = now();
    const rec = {
      id: id(),
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash: input.passwordHash,
      googleSubject: input.googleSubject ?? null,
      method: input.method,
      role: (input.intent ?? "shopper") as UserRole,
      intent: input.intent,
      accountStatus: "pending_verification" as AccountStatus,
      emailVerified: input.method === "google",
      createdAt: t,
      updatedAt: t,
    };
    await getDb().insert(s.identities).values(rec).onConflictDoNothing();
    const row = await getDb().select().from(s.identities).where(eq(s.identities.email, rec.email)).limit(1);
    return mapIdentity(row[0]);
  },
  async getByEmail(email: string): Promise<Identity | null> {
    const row = await getDb().select().from(s.identities).where(eq(s.identities.email, email.toLowerCase())).limit(1);
    return row[0] ? mapIdentity(row[0]) : null;
  },
  async getById(iid: string): Promise<Identity | null> {
    const row = await getDb().select().from(s.identities).where(eq(s.identities.id, iid)).limit(1);
    return row[0] ? mapIdentity(row[0]) : null;
  },
  async getByGoogleSubject(sub: string): Promise<Identity | null> {
    const row = await getDb().select().from(s.identities).where(eq(s.identities.googleSubject, sub)).limit(1);
    return row[0] ? mapIdentity(row[0]) : null;
  },
  async list(): Promise<Identity[]> {
    const rows = await getDb().select().from(s.identities);
    return rows.map(mapIdentity);
  },
  async patch(iid: string, p: Partial<Identity>): Promise<Identity | null> {
    const update: Record<string, unknown> = { updatedAt: now() };
    if (p.name !== undefined) update.name = p.name;
    if (p.passwordHash !== undefined) update.passwordHash = p.passwordHash;
    if (p.googleSubject !== undefined) update.googleSubject = p.googleSubject;
    if (p.method !== undefined) update.method = p.method;
    if (p.role !== undefined) update.role = p.role;
    if (p.staffRole !== undefined) update.staffRole = p.staffRole;
    if (p.intent !== undefined) update.intent = p.intent;
    if (p.accountStatus !== undefined) update.accountStatus = p.accountStatus;
    if (p.emailVerified !== undefined) update.emailVerified = p.emailVerified;
    if (p.campus !== undefined) update.campus = p.campus;
    if (p.consent !== undefined) update.consent = p.consent;
    if (p.vendorId !== undefined) update.vendorId = p.vendorId;
    if (p.avatarUrl !== undefined) update.avatarUrl = p.avatarUrl;
    await getDb().update(s.identities).set(update).where(eq(s.identities.id, iid));
    return this.getById(iid);
  },
  async setStatus(iid: string, status: AccountStatus): Promise<void> {
    await getDb().update(s.identities).set({ accountStatus: status, updatedAt: now() }).where(eq(s.identities.id, iid));
  },
};

// ---- SessionRepo (server-side, sameSite=lax cookie maps to `sessions` row) ---
export const realSessionRepo = {
  async create(identityId: string, opts?: { ttlMs?: number }): Promise<Session> {
    const t = now();
    const sess: Session = {
      id: id(),
      identityId,
      createdAt: t,
      // Default 30-day (Doc 09 §9.5). remember=false → 1-day via opts.ttlMs.
      expiresAt: new Date(Date.now() + (opts?.ttlMs ?? 30 * 24 * 60 * 60 * 1000)).toISOString(),
    };
    await getDb().insert(s.sessions).values(sess);
    return sess;
  },
  async get(sid: string): Promise<Session | null> {
    const row = await getDb().select().from(s.sessions).where(eq(s.sessions.id, sid)).limit(1);
    if (!row[0]) return null;
    if (Date.now() > new Date(row[0].expiresAt).getTime()) {
      await getDb().delete(s.sessions).where(eq(s.sessions.id, sid));
      return null;
    }
    return row[0];
  },
  async listForIdentity(identityId: string): Promise<Session[]> {
    const now = Date.now();
    const rows = await getDb()
      .select()
      .from(s.sessions)
      .where(eq(s.sessions.identityId, identityId));
    return rows
      .filter((r) => now <= new Date(r.expiresAt).getTime())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async revoke(sid: string): Promise<void> {
    await getDb().delete(s.sessions).where(eq(s.sessions.id, sid));
  },
  async revokeAllForIdentity(identityId: string): Promise<void> {
    await getDb().delete(s.sessions).where(eq(s.sessions.identityId, identityId));
  },
};

// ---- PendingTokenRepo -------------------------------------------------------
export const realPendingTokenRepo = {
  async create(input: { email: string; purpose: OtpPurpose; ttlMs?: number }): Promise<PendingToken> {
    const t = now();
    const pt: PendingToken = {
      token: id(),
      email: input.email.toLowerCase(),
      purpose: input.purpose,
      createdAt: t,
      expiresAt: new Date(Date.now() + (input.ttlMs ?? 15 * 60 * 1000)).toISOString(),
      used: false,
    };
    await getDb().insert(s.pendingTokens).values(pt);
    return pt;
  },
  async get(token: string): Promise<PendingToken | null> {
    const row = await getDb().select().from(s.pendingTokens).where(eq(s.pendingTokens.token, token)).limit(1);
    return row[0] ?? null;
  },
  async consume(token: string): Promise<boolean> {
    const row = await getDb().select().from(s.pendingTokens).where(eq(s.pendingTokens.token, token)).limit(1);
    if (!row[0] || row[0].used || Date.now() > new Date(row[0].expiresAt).getTime()) return false;
    await getDb().update(s.pendingTokens).set({ used: true }).where(eq(s.pendingTokens.token, token));
    return true;
  },
};

// ---- OtpRepo ----------------------------------------------------------------
export const realOtpRepo = {
  async issue(email: string, purpose: OtpPurpose): Promise<string> {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await getDb().insert(s.otps).values({
      id: id(),
      email: email.toLowerCase(),
      purpose,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      attempts: 0,
    });
    return code;
  },
  /** DEV-ONLY (2026-08-29): latest unexpired code for email+purpose. Powers
   *  /api/dev/otp in real-DB mode; no production caller. */
  async peek(email: string, purpose: OtpPurpose): Promise<string | null> {
    const rows = await getDb().select().from(s.otps).where(and(eq(s.otps.email, email.toLowerCase()), eq(s.otps.purpose, purpose)));
    const now = Date.now();
    const active = rows
      .filter((r) => now <= new Date(r.expiresAt).getTime())
      .sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime());
    return active[0]?.code ?? null;
  },
  async verify(email: string, code: string, purpose: OtpPurpose): Promise<boolean> {
    const rows = await getDb().select().from(s.otps).where(and(eq(s.otps.email, email.toLowerCase()), eq(s.otps.purpose, purpose)));
    const match = rows.find((r) => r.code === code && Date.now() <= new Date(r.expiresAt).getTime());
    if (!match) return false;
    // P-A round 21 (FIX): delete only THIS purpose's OTPs (was deleting ALL otps
    // for the email — a google-verify OTP would wipe a signup OTP mid-flow).
    await getDb().delete(s.otps).where(and(eq(s.otps.email, email.toLowerCase()), eq(s.otps.purpose, purpose)));
    return true;
  },
  async revoke(email: string, purpose: OtpPurpose): Promise<void> {
    await getDb().delete(s.otps).where(and(eq(s.otps.email, email.toLowerCase()), eq(s.otps.purpose, purpose)));
  },
};

// ---- MagicLinkRepo ----------------------------------------------------------
export const realMagicLinkRepo = {
  async issue(email: string): Promise<string> {
    const token = id();
    await getDb().insert(s.magicLinks).values({
      token,
      email: email.toLowerCase(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      used: false,
    });
    return token;
  },
  async consume(token: string): Promise<{ ok: boolean; email?: string }> {
    const row = await getDb().select().from(s.magicLinks).where(eq(s.magicLinks.token, token)).limit(1);
    if (!row[0] || row[0].used || Date.now() > new Date(row[0].expiresAt).getTime()) return { ok: false };
    await getDb().update(s.magicLinks).set({ used: true }).where(eq(s.magicLinks.token, token));
    return { ok: true, email: row[0].email };
  },
};

// ---- ConsentRepo (reads/writes identities.consent JSONB) --------------------
export const realConsentRepo = {
  async accept(identityId: string, method: AuthMethod): Promise<void> {
    const idRow = await getDb().select().from(s.identities).where(eq(s.identities.id, identityId)).limit(1);
    if (!idRow[0]) return;
    const consent: ConsentAcceptance[] = idRow[0].consent ?? [];
    consent.push({
      termsVersion: "2026-08-01",
      privacyVersion: "2026-08-01",
      acceptedAt: now(),
      method,
    });
    await getDb().update(s.identities).set({ consent, updatedAt: now() }).where(eq(s.identities.id, identityId));
  },
  async latest(identityId: string): Promise<ConsentAcceptance | null> {
    const row = await getDb().select().from(s.identities).where(eq(s.identities.id, identityId)).limit(1);
    const c = row[0]?.consent ?? [];
    return c.length ? c[c.length - 1] : null;
  },
  async isCurrent(identityId: string): Promise<boolean> {
    const latest = await this.latest(identityId);
    return !!latest && latest.termsVersion === "2026-08-01" && latest.privacyVersion === "2026-08-01";
  },
};

// ---- AuthRepo.currentIdentity (mirrors the mock fix: pending_verification may hold a session) ---
export const realAuthRepo = {
  async currentIdentity(sessionId: string | null): Promise<Identity | null> {
    if (!sessionId) return null;
    const sess = await realSessionRepo.get(sessionId);
    if (!sess) return null;
    const idRow = await getDb().select().from(s.identities).where(eq(s.identities.id, sess.identityId)).limit(1);
    if (!idRow[0]) {
      await realSessionRepo.revoke(sessionId);
      return null;
    }
    // Same allowlist as the mock fix: only suspended/banned/deleted block.
    if (["suspended", "banned", "deleted"].includes(idRow[0].accountStatus)) {
      await realSessionRepo.revoke(sessionId);
      return null;
    }
    return mapIdentity(idRow[0]);
  },
  async getIdentityById(iid: string): Promise<Identity | null> {
    return realIdentityRepo.getById(iid);
  },
};

// ---- UserPreferenceRepo -----------------------------------------------------
export const realUserPreferenceRepo = {
  async get(identityId: string): Promise<UserPreference | null> {
    const row = await getDb().select().from(s.userPreferences).where(eq(s.userPreferences.identityId, identityId)).limit(1);
    if (!row[0]) return null;
    return {
      identityId: row[0].identityId,
      campus: row[0].campus,
      notificationPrefs: (row[0].notificationPrefs ?? {}) as Record<string, NotificationPref>,
      interestTags: row[0].interestTags ?? [],
      feedPrefsSetAt: row[0].feedPrefsSetAt ?? null,
      updatedAt: row[0].updatedAt,
    };
  },
  async save(input: {
    identityId: string;
    campus?: string;
    interestTags?: string[];
    feedPrefsSetAt?: string | null;
    notificationPrefs?: Record<string, string>;
  }): Promise<UserPreference> {
    const t = now();
    const existing = await this.get(input.identityId);
    const rec = {
      identityId: input.identityId,
      campus: input.campus ?? existing?.campus ?? "",
      notificationPrefs: input.notificationPrefs ?? existing?.notificationPrefs ?? {},
      interestTags: input.interestTags ?? existing?.interestTags ?? [],
      feedPrefsSetAt: input.feedPrefsSetAt ?? existing?.feedPrefsSetAt ?? null,
      updatedAt: t,
    };
    await getDb().insert(s.userPreferences).values(rec).onConflictDoUpdate({ target: s.userPreferences.identityId, set: rec });
    return rec as UserPreference;
  },
};

// ---- AuditStore -------------------------------------------------------------
export const realAuditStore = {
  async log(entry: Omit<AuditEntry, "id" | "at">): Promise<void> {
    await getDb().insert(s.auditLog).values({ id: id(), at: now(), ...entry });
  },
  async query(filter?: { type?: string; identityId?: string; limit?: number }): Promise<AuditEntry[]> {
    let q = getDb().select().from(s.auditLog).orderBy(desc(s.auditLog.at));
    if (filter?.type) q = q.where(eq(s.auditLog.type, filter.type)) as typeof q;
    if (filter?.identityId) q = q.where(eq(s.auditLog.identityId, filter.identityId)) as typeof q;
    const rows = await q.limit(filter?.limit ?? 100);
    return rows.map((r) => ({ ...r, metadata: r.metadata ?? {} }));
  },
};

// ---- PageEventsStore (P-A round 60) ----------------------------------------
// Append-only activity ledger for the admin analytics views. Privacy-respecting:
// identity_id + event type + refId only — never email/name/message body.
export const realPageEventStore = {
  async log(event: {
    identityId?: string | null;
    type: string;
    refId?: string | null;
    path?: string | null;
    platform?: string | null;
    ipHash?: string | null;
  }): Promise<void> {
    await getDb().insert(s.pageEvents).values({
      id: id(),
      identityId: event.identityId ?? null,
      type: event.type,
      refId: event.refId ?? null,
      path: event.path ?? null,
      platform: event.platform ?? null,
      ipHash: event.ipHash ?? null,
      at: now(),
    });
  },
  async query(filter?: {
    type?: string;
    identityId?: string;
    refId?: string;
    since?: number;
    limit?: number;
  }): Promise<Array<{
    id: string;
    identityId: string | null;
    type: string;
    refId: string | null;
    path: string | null;
    platform: string | null;
    ipHash: string | null;
    at: string;
  }>> {
    let q = getDb().select().from(s.pageEvents).orderBy(desc(s.pageEvents.at));
    if (filter?.type) q = q.where(eq(s.pageEvents.type, filter.type)) as typeof q;
    if (filter?.identityId) q = q.where(eq(s.pageEvents.identityId, filter.identityId)) as typeof q;
    if (filter?.refId) q = q.where(eq(s.pageEvents.refId, filter.refId)) as typeof q;
    const rows = filter?.limit ? await q.limit(filter.limit) : await q;
    let out = rows.map((r) => ({
      id: r.id,
      identityId: r.identityId ?? null,
      type: r.type,
      refId: r.refId ?? null,
      path: r.path ?? null,
      platform: r.platform ?? null,
      ipHash: r.ipHash ?? null,
      at: r.at,
    }));
    if (filter?.since) {
      out = out.filter((e) => new Date(e.at).getTime() >= (filter.since ?? 0));
    }
    return out;
  },
  async countByType(filter?: { since?: number; type?: string }): Promise<Array<{ type: string; count: number }>> {
    const rows = await getDb().select({ type: s.pageEvents.type, at: s.pageEvents.at }).from(s.pageEvents);
    const since = filter?.since ?? 0;
    const counts = new Map<string, number>();
    for (const r of rows) {
      if (filter?.type && r.type !== filter.type) continue;
      if (since && new Date(r.at).getTime() < since) continue;
      counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
    }
    return [...counts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  },
};

// ---- VendorRepo -------------------------------------------------------------
function mapVendor(r: typeof s.vendors.$inferSelect): Vendor {
  return {
    id: r.id,
    name: r.name,
    handle: r.handle,
    campus: r.campus,
    categoryIds: r.categoryIds ?? [],
    status: r.status as Vendor["status"],
    verified: r.verified,
    description: r.description,
    subArea: r.subArea ?? null,
    profilePhotoUrl: r.profilePhotoUrl ?? null,
    hours: (r.hours ?? null) as Vendor["hours"],
    socials: r.socials ?? null,
    agreementVersion: r.agreementVersion ?? null,
    agreementAcceptedAt: r.agreementAcceptedAt ?? null,
    identityId: r.identityId ?? null,
    slug: r.slug,
  };
}
export const realVendorRepo = {
  async listVendors(params?: { campus?: string; publicOnly?: boolean }): Promise<Vendor[]> {
    const rows = params?.campus
      ? await getDb().select().from(s.vendors).where(eq(s.vendors.campus, params.campus))
      : await getDb().select().from(s.vendors);
    let vendors = rows.map(mapVendor);
    if (params?.publicOnly) {
      // P-A round 69: public surfaces (Explore) only show LIVE vendors. A
      // pending_listings vendor is not yet public — their storefront 404s;
      // their listings must not leak either.
      vendors = vendors.filter((v) => v.status === "live");
    }
    return vendors;
  },
  async getById(vid: string): Promise<Vendor | null> {
    const row = await getDb().select().from(s.vendors).where(eq(s.vendors.id, vid)).limit(1);
    return row[0] ? mapVendor(row[0]) : null;
  },
  async getByIdentityId(identityId: string): Promise<Vendor | null> {
    const row = await getDb().select().from(s.vendors).where(eq(s.vendors.identityId, identityId)).limit(1);
    return row[0] ? mapVendor(row[0]) : null;
  },
  async create(input: Partial<Vendor> & { identityId: string; name: string; campus: string; categoryIds: string[] }): Promise<Vendor> {
    const rec = {
      id: id(),
      name: input.name,
      handle: input.handle ?? input.name.toLowerCase().replace(/\s+/g, "-"),
      campus: input.campus,
      categoryIds: input.categoryIds,
      status: (input.status ?? "pending_listings") as Vendor["status"],
      verified: input.verified ?? false,
      description: input.description ?? "",
      subArea: input.subArea ?? null,
      profilePhotoUrl: input.profilePhotoUrl ?? null,
      hours: input.hours ?? null,
      socials: input.socials ?? null,
      agreementVersion: input.agreementVersion ?? null,
      agreementAcceptedAt: input.agreementAcceptedAt ?? null,
      identityId: input.identityId,
      slug: input.slug ?? input.name.toLowerCase().replace(/\s+/g, "-") + "-" + id().slice(0, 4),
    };
    await getDb().insert(s.vendors).values(rec);
    return mapVendor(rec);
  },
  async patch(vid: string, p: Partial<Vendor>): Promise<Vendor | null> {
    const update: Record<string, unknown> = {};
    for (const k of Object.keys(p)) {
      if ((p as Record<string, unknown>)[k] !== undefined) update[k] = (p as Record<string, unknown>)[k];
    }
    await getDb().update(s.vendors).set(update).where(eq(s.vendors.id, vid));
    return this.getById(vid);
  },
};

// ---- ListingsRepo (5-image cap enforced in API; schema stores array) -------
function mapListing(r: typeof s.listings.$inferSelect): Listing {
  return {
    id: r.id,
    vendorId: r.vendorId,
    title: r.title,
    priceMinor: r.priceMinor,
    isPublished: r.isPublished,
    images: r.images ?? [],
    priceMinMinor: r.priceMinMinor,
    priceMaxMinor: r.priceMaxMinor ?? null,
    categoryId: r.categoryId,
    description: r.description ?? null,
    shortDescription: r.shortDescription ?? null,
    status: r.status as Listing["status"],
    isFeatured: r.isFeatured,
    featuredUntil: r.featuredUntil ?? null,
  };
}
export const realListingsRepo = {
  async list(params?: { campus?: string; category?: string; publicOnly?: boolean }): Promise<Listing[]> {
    const rows = await getDb().select().from(s.listings);
    let listings = rows.map(mapListing);
    if (params?.campus) {
      const campusVendorIds = (
        await getDb().select({ id: s.vendors.id }).from(s.vendors).where(eq(s.vendors.campus, params.campus))
      ).map((v) => v.id);
      const idSet = new Set(campusVendorIds);
      listings = listings.filter((l) => idSet.has(l.vendorId));
    }
    if (params?.publicOnly) {
      // P-A round 69 (Explore visibility audit): PUBLIC surfaces must not show
      // drafts, removed listings, or anything owned by a NON-live vendor.
      // The old list() returned EVERYTHING, so a draft or a pending_listings
      // vendor's post leaked to Explore (while their storefront 404'd!). Filter
      // at the repo layer = single source of truth for every public read.
      const liveVendorIds = (
        await getDb()
          .select({ id: s.vendors.id })
          .from(s.vendors)
          .where(eq(s.vendors.status, "live"))
      ).map((v) => v.id);
      const liveSet = new Set(liveVendorIds);
      listings = listings.filter(
        (l) => l.isPublished === true && l.status === "active" && liveSet.has(l.vendorId),
      );
    }
    return listings
      .filter((l) => (params?.category ? l.categoryId === params.category : true));
  },
  async getById(lid: string): Promise<Listing | null> {
    const row = await getDb().select().from(s.listings).where(eq(s.listings.id, lid)).limit(1);
    return row[0] ? mapListing(row[0]) : null;
  },
  async create(input: Partial<Listing> & { vendorId: string; title: string; priceMinMinor: number; categoryId: string }): Promise<Listing> {
    const rec = {
      id: id(),
      vendorId: input.vendorId,
      title: input.title,
      priceMinor: input.priceMinMinor,
      isPublished: input.isPublished ?? true,
      images: input.images ?? [],
      priceMinMinor: input.priceMinMinor,
      priceMaxMinor: input.priceMaxMinor ?? null,
      categoryId: input.categoryId,
      description: input.description ?? null,
      shortDescription: input.shortDescription ?? null,
      status: (input.status ?? "active") as Listing["status"],
      isFeatured: input.isFeatured ?? false,
      featuredUntil: input.featuredUntil ?? null,
    };
    await getDb().insert(s.listings).values(rec);
    return mapListing(rec);
  },
  async update(lid: string, p: Partial<Listing>): Promise<Listing | null> {
    const update: Record<string, unknown> = {};
    for (const k of Object.keys(p)) {
      if ((p as Record<string, unknown>)[k] !== undefined) update[k] = (p as Record<string, unknown>)[k];
    }
    await getDb().update(s.listings).set(update).where(eq(s.listings.id, lid));
    return this.getById(lid);
  },
  async remove(lid: string): Promise<boolean> {
    // P-A round 22 (DATA FIX): child-first delete — schema has NO onDelete
    // cascade, so a single-row listing delete orphaned comments/likes/reports/
    // wishlistItems forever (inflating counts, leaking deleted content).
    await getDb().delete(s.likes).where(and(eq(s.likes.targetType, "listing"), eq(s.likes.targetId, lid)));
    await getDb().delete(s.reports).where(and(eq(s.reports.targetType, "listing"), eq(s.reports.targetId, lid)));
    await getDb().delete(s.comments).where(eq(s.comments.listingId, lid));
    await getDb().delete(s.wishlistItems).where(eq(s.wishlistItems.listingId, lid));
    await getDb().delete(s.listings).where(eq(s.listings.id, lid));
    return true;
  },
};

// ---- ReviewRepo -------------------------------------------------------------
function mapReview(r: typeof s.reviews.$inferSelect): Review {
  return {
    id: r.id,
    vendorId: r.vendorId,
    authorId: r.authorId,
    rating: r.rating,
    body: r.body,
    createdAt: r.createdAt,
    response: r.response ?? null,
    status: r.status as Review["status"],
  };
}
function mapMessage(r: typeof s.messages.$inferSelect): Message {
  return {
    id: r.id,
    conversationId: r.conversationId,
    senderId: r.senderId,
    body: r.body,
    state: r.state as MessageState,
    createdAt: r.createdAt,
    readAt: r.readAt ?? null,
    clientMsgId: r.clientMsgId ?? undefined,
  };
}
function mapStaffCase(r: typeof s.staffCases.$inferSelect): StaffCase {
  return {
    id: r.id,
    queue: r.queue,
    decision: r.decision ?? null,
    consequence: r.consequence ?? null,
    status: r.status as StaffCase["status"],
    assignedTo: r.assignedTo ?? null,
    resolution: r.resolution ?? null,
    // P-A round 57 (C3)
    payload: r.payload ?? null,
    createdAt: r.createdAt ?? null,
  };
}
function mapLike(r: typeof s.likes.$inferSelect): Like {
  return { id: r.id, actorId: r.actorId, targetId: r.targetId, targetType: r.targetType as Like["targetType"], createdAt: r.createdAt };
}
function mapComment(r: typeof s.comments.$inferSelect): Comment {
  return { id: r.id, listingId: r.listingId, authorId: r.authorId, body: r.body, createdAt: r.createdAt, status: r.status as Comment["status"] };
}

export const realReviewRepo = {
  async create(input: { shopperId: string; vendorId: string; rating: number; body: string }): Promise<Review> {
    const rec: Review = {
      id: id(),
      vendorId: input.vendorId,
      authorId: input.shopperId,
      rating: input.rating,
      body: input.body,
      createdAt: now(),
      response: null,
      status: "visible",
    };
    await getDb().insert(s.reviews).values(rec);
    return rec;
  },
  async listByVendor(vendorId: string): Promise<Review[]> {
    const rows = await getDb().select().from(s.reviews).where(eq(s.reviews.vendorId, vendorId));
    return rows.map(mapReview);
  },
  async getById(rid: string): Promise<Review | null> {
    const row = await getDb().select().from(s.reviews).where(eq(s.reviews.id, rid)).limit(1);
    return row[0] ? mapReview(row[0]) : null;
  },
  async respond(reviewId: string, _vendorId: string, body: string): Promise<Review | null> {
    const rec = { response: { body, createdAt: now(), editedAt: null } };
    await getDb().update(s.reviews).set(rec).where(eq(s.reviews.id, reviewId));
    return this.getById(reviewId);
  },
  async patch(rid: string, p: Partial<Review>): Promise<Review | null> {
    await getDb().update(s.reviews).set(p as Record<string, unknown>).where(eq(s.reviews.id, rid));
    return this.getById(rid);
  },
  async listAll(): Promise<Review[]> {
    return (await getDb().select().from(s.reviews)).map(mapReview);
  },
};

// ---- ConversationRepo / MessageRepo -----------------------------------------
export const realConversationRepo = {
  async create(input: { participantIds: string[]; listingId?: string | null }): Promise<Conversation> {
    const t = now();
    const conv: Conversation = {
      id: id(),
      participantIds: input.participantIds,
      lastMessageAt: t,
      createdAt: t,
      lastSeen: {},
      // P-A round 45: the schema HAS listing_id but the repo dropped it —
      // conversations were never tagged with their listing, so the thread
      // (#1) wasn't shown. Persist it now.
      listingId: input.listingId ?? null,
    };
    await getDb().insert(s.conversations).values(conv);
    return conv;
  },
  async getById(cid: string): Promise<Conversation | null> {
    const row = await getDb().select().from(s.conversations).where(eq(s.conversations.id, cid)).limit(1);
    return row[0] ?? null;
  },
  async listForIdentity(identityId: string): Promise<Conversation[]> {
    const rows = await getDb().select().from(s.conversations);
    return rows.filter((c) => c.participantIds.includes(identityId));
  },
  async updateLastMessageAt(cid: string, ts: string): Promise<void> {
    await getDb().update(s.conversations).set({ lastMessageAt: ts }).where(eq(s.conversations.id, cid));
  },
  async touchLastSeen(cid: string, identityId: string): Promise<void> {
    const row = await getDb().select().from(s.conversations).where(eq(s.conversations.id, cid)).limit(1);
    if (!row[0]) return;
    const lastSeen = { ...(row[0].lastSeen ?? {}), [identityId]: now() };
    await getDb().update(s.conversations).set({ lastSeen }).where(eq(s.conversations.id, cid));
  },
};

export const realMessageRepo = {
  async listConversations(identityId: string): Promise<Conversation[]> {
    return realConversationRepo.listForIdentity(identityId);
  },
  async create(input: { conversationId: string; senderId: string; body: string; clientMsgId?: string }): Promise<Message> {
    const rec: Message = {
      id: id(),
      conversationId: input.conversationId,
      senderId: input.senderId,
      body: input.body,
      state: "sent" as MessageState,
      createdAt: now(),
      readAt: null,
      clientMsgId: input.clientMsgId,
    };
    await getDb().insert(s.messages).values(rec);
    return rec;
  },
  async listByConversation(conversationId: string, cursor?: string | null, limit = 50): Promise<Message[]> {
    const rows = await getDb().select().from(s.messages).where(eq(s.messages.conversationId, conversationId));
    const sliced = cursor ? rows.filter((m) => m.createdAt > cursor) : rows;
    return sliced.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, limit).map(mapMessage);
  },
  async getById(mid: string): Promise<Message | null> {
    const row = await getDb().select().from(s.messages).where(eq(s.messages.id, mid)).limit(1);
    return row[0] ? mapMessage(row[0]) : null;
  },
  async updateState(mid: string, state: MessageState): Promise<Message | null> {
    await getDb().update(s.messages).set({ state }).where(eq(s.messages.id, mid));
    return this.getById(mid);
  },
  async markDelivered(conversationId: string, recipientId: string): Promise<void> {
    await getDb().update(s.messages)
      .set({ state: "delivered" })
      .where(and(eq(s.messages.conversationId, conversationId), eq(s.messages.senderId, recipientId)));
  },
  async markRead(conversationId: string, recipientId: string): Promise<void> {
    await getDb().update(s.messages)
      .set({ state: "read", readAt: now() })
      .where(and(eq(s.messages.conversationId, conversationId), eq(s.messages.senderId, recipientId)));
  },
  async listAll(): Promise<Message[]> {
    return (await getDb().select().from(s.messages)).map(mapMessage);
  },
};

// ---- StaffRepo --------------------------------------------------------------
export const realStaffRepo = {
  async create(input: { queue: string; decision: string | null; consequence: string | null; payload?: Record<string, unknown> | null; createdAt?: string | null }): Promise<StaffCase> {
    const rec: StaffCase = {
      id: id(),
      queue: input.queue,
      decision: input.decision,
      consequence: input.consequence,
      status: "open",
      // P-A round 57 (C3): structured payload + real createdAt.
      payload: input.payload ?? {},
      createdAt: input.createdAt ?? now(),
    };
    // Insert with explicit non-null values (StaffCase fields are nullable in
    // the interface for reads; Drizzle insert wants the concrete shapes).
    await getDb().insert(s.staffCases).values({
      id: rec.id,
      queue: rec.queue,
      decision: rec.decision,
      consequence: rec.consequence,
      status: rec.status,
      payload: rec.payload ?? {},
      createdAt: rec.createdAt ?? "",
    });
    return rec;
  },
  async listCases(queue: string): Promise<StaffCase[]> {
    // P-A round 57 (audit C1): queue="" must mean ALL cases. The old code ran
    // `WHERE queue=''` for the "all" lookup — which matches NOTHING, so triage
    // lookups (assign/resolve/dismiss) always 404ed, and the admin analytics
    // always saw zero open reports. Root of both C1 and C2.
    if (!queue) {
      const rows = await getDb().select().from(s.staffCases);
      return rows.map(mapStaffCase);
    }
    const rows = await getDb().select().from(s.staffCases).where(eq(s.staffCases.queue, queue));
    return rows.map(mapStaffCase);
  },
  async assignCase(caseId: string, assignedTo: string): Promise<StaffCase | null> {
    await getDb().update(s.staffCases).set({ assignedTo, status: "triaged" }).where(eq(s.staffCases.id, caseId));
    const row = await getDb().select().from(s.staffCases).where(eq(s.staffCases.id, caseId)).limit(1);
    return row[0] ? mapStaffCase(row[0]) : null;
  },
  async resolveCase(caseId: string, resolution: string, status?: "resolved" | "dismissed"): Promise<StaffCase | null> {
    await getDb().update(s.staffCases).set({ resolution, status: status ?? "resolved" }).where(eq(s.staffCases.id, caseId));
    const row = await getDb().select().from(s.staffCases).where(eq(s.staffCases.id, caseId)).limit(1);
    return row[0] ? mapStaffCase(row[0]) : null;
  },
};

// ---- Relationship repos (wishlist / follow / like) --------------------------
export const realSavedListingRepo = {
  async toggle(input: { shopperId: string; targetType: "listing" | "vendor"; targetId: string }) {
    const existing = await getDb().select().from(s.wishlistItems).where(
      and(eq(s.wishlistItems.shopperId, input.shopperId), eq(s.wishlistItems.listingId, input.targetId)),
    );
    if (existing[0]) {
      await getDb().delete(s.wishlistItems).where(eq(s.wishlistItems.id, existing[0].id));
      return { saved: false };
    }
    const item: WishlistItem = {
      id: id(),
      shopperId: input.shopperId,
      listingId: input.targetType === "listing" ? input.targetId : null,
      vendorId: input.targetType === "vendor" ? input.targetId : null,
      createdAt: now(),
    };
    await getDb().insert(s.wishlistItems).values(item);
    return { saved: true, item };
  },
  async list(shopperId: string): Promise<WishlistItem[]> {
    return getDb().select().from(s.wishlistItems).where(eq(s.wishlistItems.shopperId, shopperId));
  },
};

export const realFollowRepo = {
  async toggle(input: { followerId: string; vendorId: string }) {
    const existing = await getDb().select().from(s.follows).where(
      and(eq(s.follows.followerId, input.followerId), eq(s.follows.vendorId, input.vendorId)),
    );
    if (existing[0]) {
      await getDb().delete(s.follows).where(eq(s.follows.id, existing[0].id));
      return { following: false };
    }
    const f: Follow = { id: id(), followerId: input.followerId, vendorId: input.vendorId, createdAt: now() };
    await getDb().insert(s.follows).values(f);
    return { following: true, follow: f };
  },
  async list(followerId: string): Promise<Follow[]> {
    return getDb().select().from(s.follows).where(eq(s.follows.followerId, followerId));
  },
  async listByVendor(vendorId: string): Promise<Follow[]> {
    return getDb().select().from(s.follows).where(eq(s.follows.vendorId, vendorId));
  },
};

export const realLikeRepo = {
  async toggle(input: { actorId: string; targetId: string; targetType: "listing" | "vendor" }) {
    const existing = await getDb().select().from(s.likes).where(
      and(eq(s.likes.actorId, input.actorId), eq(s.likes.targetId, input.targetId)),
    );
    if (existing[0]) {
      await getDb().delete(s.likes).where(eq(s.likes.id, existing[0].id));
      return { liked: false };
    }
    const l: Like = { id: id(), actorId: input.actorId, targetId: input.targetId, targetType: input.targetType, createdAt: now() };
    await getDb().insert(s.likes).values(l);
    return { liked: true, like: l };
  },
  async list(actorId: string): Promise<Like[]> {
    const rows = await getDb().select().from(s.likes).where(eq(s.likes.actorId, actorId));
    return rows.map(mapLike);
  },
};

// ---- CommentRepo ------------------------------------------------------------
export const realCommentRepo = {
  async create(input: { listingId: string; authorId: string; body: string }): Promise<Comment> {
    const rec: Comment = { id: id(), listingId: input.listingId, authorId: input.authorId, body: input.body, createdAt: now(), status: "published" };
    await getDb().insert(s.comments).values(rec);
    return rec;
  },
  async listByListing(listingId: string): Promise<Comment[]> {
    const rows = await getDb().select().from(s.comments).where(eq(s.comments.listingId, listingId));
    return rows.map(mapComment);
  },
  async getById(cid: string): Promise<Comment | null> {
    const row = await getDb().select().from(s.comments).where(eq(s.comments.id, cid)).limit(1);
    return row[0] ? mapComment(row[0]) : null;
  },
  async update(cid: string, authorId: string, body: string): Promise<Comment | null> {
    // author-only: caller passes their identityId; if it doesn't match the
    // comment's author, no row is touched (guard in route, enforced here too).
    const rows = await getDb()
      .update(s.comments)
      .set({ body })
      .where(and(eq(s.comments.id, cid), eq(s.comments.authorId, authorId)))
      .returning();
    return rows[0] ? mapComment(rows[0]) : null;
  },
  async remove(cid: string, authorId: string): Promise<boolean> {
    const rows = await getDb()
      .delete(s.comments)
      .where(and(eq(s.comments.id, cid), eq(s.comments.authorId, authorId)))
      .returning({ id: s.comments.id });
    return rows.length > 0;
  },
};

// ---- ReportRepo -------------------------------------------------------------
function mapReport(r: typeof s.reports.$inferSelect): Report {
  return { id: r.id, reporterId: r.reporterId, targetType: r.targetType as Report["targetType"], targetId: r.targetId, category: r.category as ReportCategory, body: r.body ?? null, status: r.status as Report["status"], createdAt: r.createdAt };
}
function mapNotification(r: typeof s.notifications.$inferSelect): Notification {
  return { id: r.id, recipientId: r.recipientId, type: r.type as NotificationType, title: r.title, body: r.body, refId: r.refId ?? null, read: r.read, createdAt: r.createdAt };
}
function mapAgreement(r: typeof s.agreements.$inferSelect): Agreement {
  return { id: r.id, kind: r.kind as Agreement["kind"], version: r.version, body: r.body, effectiveAt: r.effectiveAt, isCurrent: r.isCurrent };
}

export const realReportRepo = {
  async create(input: { reporterId: string; targetType: "listing" | "vendor" | "message"; targetId: string; category: ReportCategory; body: string | null }): Promise<Report> {
    const rec: Report = { id: id(), reporterId: input.reporterId, targetType: input.targetType, targetId: input.targetId, category: input.category, body: input.body, status: "open", createdAt: now() };
    await getDb().insert(s.reports).values(rec);
    return rec;
  },
  async list(): Promise<Report[]> {
    const rows = await getDb().select().from(s.reports);
    return rows.map(mapReport);
  },
};

// ---- NotificationRepo ------------------------------------------------------
export const realNotificationRepo = {
  async create(input: { recipientId: string; type: NotificationType; title: string; body: string; refId?: string | null }): Promise<Notification> {
    const rec: Notification = { id: id(), recipientId: input.recipientId, type: input.type, title: input.title, body: input.body, refId: input.refId ?? null, read: false, createdAt: now() };
    await getDb().insert(s.notifications).values(rec);
    return rec;
  },
  async list(recipientId: string): Promise<Notification[]> {
    const rows = await getDb().select().from(s.notifications).where(eq(s.notifications.recipientId, recipientId)).orderBy(desc(s.notifications.createdAt));
    return rows.map(mapNotification);
  },
  async markRead(nid: string, recipientId: string): Promise<boolean> {
    await getDb().update(s.notifications).set({ read: true }).where(and(eq(s.notifications.id, nid), eq(s.notifications.recipientId, recipientId)));
    return true;
  },
  async markAllRead(recipientId: string): Promise<boolean> {
    await getDb().update(s.notifications).set({ read: true }).where(eq(s.notifications.recipientId, recipientId));
    return true;
  },
};

// ---- AgreementRepo / FeatureFlagRepo / ActivityRepo -------------------------
export const realAgreementRepo = {
  async list(kind?: Agreement["kind"]): Promise<Agreement[]> {
    const rows = kind ? await getDb().select().from(s.agreements).where(eq(s.agreements.kind, kind)) : await getDb().select().from(s.agreements);
    return rows.map(mapAgreement);
  },
  async create(input: { kind: Agreement["kind"]; version: string; body: string }): Promise<Agreement> {
    const rec: Agreement = { id: id(), kind: input.kind, version: input.version, body: input.body, effectiveAt: now(), isCurrent: false };
    await getDb().insert(s.agreements).values(rec);
    return rec;
  },
  async setCurrent(aid: string): Promise<Agreement | null> {
    await getDb().update(s.agreements).set({ isCurrent: false });
    await getDb().update(s.agreements).set({ isCurrent: true }).where(eq(s.agreements.id, aid));
    const row = await getDb().select().from(s.agreements).where(eq(s.agreements.id, aid)).limit(1);
    return row[0] ? mapAgreement(row[0]) : null;
  },
};

export const realFeatureFlagRepo = {
  async list(): Promise<FeatureFlag[]> {
    return getDb().select().from(s.featureFlags);
  },
  async get(key: string): Promise<FeatureFlag | null> {
    const row = await getDb().select().from(s.featureFlags).where(eq(s.featureFlags.key, key)).limit(1);
    return row[0] ?? null;
  },
  async set(key: string, value: boolean, description = ""): Promise<FeatureFlag> {
    const rec = { key, value, description };
    await getDb().insert(s.featureFlags).values(rec).onConflictDoUpdate({ target: s.featureFlags.key, set: rec });
    const row = await getDb().select().from(s.featureFlags).where(eq(s.featureFlags.key, key)).limit(1);
    return row[0]!;
  },
};

export const realActivityRepo = {
  async recent(campusZone: string, limit = 20): Promise<{ id: string; type: string; campusZone: string; refId: string; ts: string }[]> {
    const rows = await getDb().select().from(s.activityEvents).where(eq(s.activityEvents.campusZone, campusZone)).orderBy(desc(s.activityEvents.ts)).limit(limit);
    return rows;
  },
};

export const realCampusRepo: CampusRepo = {
  async list(viewerIdentityId?: string): Promise<Campus[]> {
    const rows = await getDb().select().from(s.campuses);
    return visibleCampusRows(rows, viewerIdentityId);
  },
  async searchByName(query: string, viewerIdentityId?: string): Promise<Campus[]> {
    const q = query.trim().toLowerCase();
    const all = await getDb().select().from(s.campuses);
    const matched = q ? all.filter((c) => c.name.toLowerCase().includes(q)) : all;
    return visibleCampusRows(matched, viewerIdentityId);
  },
  async getBySlug(slug: string, viewerIdentityId?: string): Promise<Campus | null> {
    const row = await getDb().select().from(s.campuses).where(eq(s.campuses.slug, slug)).limit(1);
    const c = row[0];
    if (!c) return null;
    if (c.status === "verified") return c;
    if (viewerIdentityId != null && c.createdByUserId === viewerIdentityId) return c;
    return null;
  },
  async create(
    input: { name: string; slug?: string; city?: string | null; state?: string | null; lat?: number | null; lng?: number | null },
    creatorIdentityId: string,
  ): Promise<Campus> {
    const slug = (input.slug ?? input.name.trim().toLowerCase().replace(/\s+/g, "-")).replace(/[^a-z0-9-]/g, "");
    if (!slug) throw new Error("invalid_campus_slug");
    // A.6 contract (2026-08-29 fix): on slug collision, RETURN the existing campus
    // instead of throwing. The in-memory repo already behaved this way; a user
    // typing an existing campus name must be handed the existing campus, not an error.
    const existingRows = await getDb().select().from(s.campuses).where(eq(s.campuses.slug, slug)).limit(1);
    if (existingRows.length > 0) {
      return existingRows[0];
    }
    const rec = {
      id: `campus-${Date.now()}`,
      slug,
      name: input.name.trim(),
      city: input.city ?? null,
      state: input.state ?? null,
      region: null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      source: "user-added" as const,
      status: "unverified" as const,
      createdByUserId: creatorIdentityId,
      createdAt: new Date().toISOString(),
    };
    await getDb().insert(s.campuses).values(rec);
    return rec;
  },
  async setStatus(slug: string, status: "verified" | "unverified", actorIdentityId: string): Promise<Campus | null> {
    const existing = await getDb().select().from(s.campuses).where(eq(s.campuses.slug, slug)).limit(1);
    if (existing.length === 0) return null;
    await getDb().update(s.campuses).set({ status }).where(eq(s.campuses.slug, slug));
    await getDb().insert(s.auditLog).values({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "campus.status_changed",
      identityId: actorIdentityId,
      metadata: { slug, status },
      at: new Date().toISOString(),
    });
    return { ...existing[0], status };
  },
};

/** Shared visibility filter (D-1): verified + viewer's own unverified. */
function visibleCampusRows(rows: Campus[], viewerIdentityId?: string): Campus[] {
  return rows.filter(
    (c) => c.status === "verified" || (viewerIdentityId != null && c.createdByUserId === viewerIdentityId),
  );
}

// ---------------------------------------------------------------------------
// Nominatim throttle (shared DB-backed 1 req/sec gate)
// Single row in `nominatim_throttle` is claimed atomically via
// `UPDATE ... WHERE now() - last_request_at >= interval '1100 ms' RETURNING`.
// Shared across all instances/processes (Render multi-instance + Vercel proxy).
// ---------------------------------------------------------------------------

/**
 * Attempt to claim the Nominatim 1 req/sec slot. Polls up to `maxWaitMs` (default
 * 2500ms). Returns true if the slot was claimed (caller may now call Nominatim);
 * false if it timed out (caller should surface a graceful "search busy" message).
 */
export async function acquireNominatimSlot(
  requester: string,
  maxWaitMs = 2500,
): Promise<boolean> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const result = await getDb()
      .update(s.nominatimThrottle)
      .set({ lastRequestAt: new Date(), lastRequestBy: requester })
      .where(sql`now() - ${s.nominatimThrottle.lastRequestAt} >= interval '1100 milliseconds'`)
      .returning({ id: s.nominatimThrottle.id });
    if (result.length > 0) return true;
    // slot not free yet; wait a short tick and retry
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

export const realCategoryRepo = {
  async list(): Promise<{ id: string; name: string; slug: string }[]> {
    return getDb().select().from(s.categories);
  },
  async getBySlug(slug: string) {
    const row = await getDb().select().from(s.categories).where(eq(s.categories.slug, slug)).limit(1);
    return row[0] ?? null;
  },
};
