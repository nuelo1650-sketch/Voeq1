/**
 * Mock auth/identity data layer (VS2). In-memory stores behind the Doc 08 §8.3
 * interfaces. Phase 9 swaps these for a real backend; the UI never imports this
 * file directly — it goes through `AuthRepo`/typed repo interfaces.
 *
 * OTP and magic-link are SEPARATE (Reversal 6): OTP = 6-digit, registration /
 * google_verify / email_change only; magic-link = single-use URL token, reset only.
 * They must never be conflated.
 */
import { randomUUID, randomBytes, randomInt } from "crypto";
import {
  realIdentityRepo,
  realSessionRepo,
  realOtpRepo,
  realMagicLinkRepo,
  realConsentRepo,
  realAuthRepo,
  realUserPreferenceRepo,
  realPendingTokenRepo,
} from "@voeq/db";
import type {
  Identity,
  IdentityRepo,
  Session,
  SessionRepo,
  ConsentAcceptance,
  ConsentRepo,
  AuthRepo,
  OtpPurpose,
  OtpRepo,
  MagicLinkRepo,
  PendingToken,
  UserRole,
  UserPreference,
  UserPreferenceRepo,
} from "./interfaces";
import { logAudit } from "./audit";

// ---- Tunable constants (Phase 9: env-configurable) ---------------------------
export const CURRENT_TERMS_VERSION = "2026-08-01";
export const CURRENT_PRIVACY_VERSION = "2026-08-01";
export const CURRENT_VENDOR_AGREEMENT_VERSION = "2026-08-01";
export const VENDOR_AGREEMENT_TEXT = `Voeq Vendor Agreement (v${CURRENT_VENDOR_AGREEMENT_VERSION})

1. You are responsible for the accuracy of your business information, listings, and pricing.
2. All transactions are between you and the buyer; Voeq is a discovery and communication platform.
3. You will not use Voeq to list prohibited, fraudulent, or misleading goods or services.
4. You agree to respond to messages from shoppers in good faith and within a reasonable time.
5. Voeq may suspend or remove your storefront for violations of this agreement or community standards.
6. You retain ownership of your content; you grant Voeq a license to display it on the platform.`;
export const OTP_TTL_MS = 10 * 60 * 1000; // 10 min
export const OTP_MAX_ACTIVE = 3; // max concurrent active codes per (email,purpose)
export const OTP_MAX_ATTEMPTS = 5; // wrong tries before revoke+resend
export const MAGIC_LINK_TTL_MS = 60 * 60 * 1000; // 1h
export const PENDING_TTL_MS = 15 * 60 * 1000; // 15 min
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
/** Doc 09 §9.5: on password reset, invalidate all sessions (default true, const-flippable). */
export const INVALIDATE_SESSIONS_ON_RESET = true;

// ---- Stores ------------------------------------------------------------------
const identities = new Map<string, Identity>();
const sessions = new Map<string, Session>();
const pendingTokens = new Map<string, PendingToken>();
interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}
const otpStore = new Map<string, OtpEntry[]>(); // key: `${email}:${purpose}`
const magicLinks = new Map<string, { email: string; expiresAt: number; used: boolean }>();

const normalizeEmail = (e: string) => e.trim().toLowerCase();
const nowIso = () => new Date().toISOString();

// ---- IdentityRepo ------------------------------------------------------------
const mockIdentityRepoImpl: IdentityRepo = {
  async createPending(input) {
    const id = randomUUID();
    const intent = input.intent ?? null;
    const identity: Identity = {
      id,
      email: normalizeEmail(input.email),
      name: input.name,
      passwordHash: input.passwordHash ?? null,
      googleSubject: input.googleSubject ?? null,
      method: input.method,
      role: (intent ?? "shopper") as UserRole,
      intent,
      accountStatus: "pending_verification",
      emailVerified: false,
      campus: null,
      consent: [],
      vendorId: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    identities.set(id, identity);
    await logAudit("identity.created", id, {
      method: input.method,
      intent,
    });
    return identity;
  },
  async getByEmail(email) {
    const e = normalizeEmail(email);
    return [...identities.values()].find((i) => i.email === e) ?? null;
  },
  async getById(id) {
    return identities.get(id) ?? null;
  },
  async getByGoogleSubject(sub) {
    return [...identities.values()].find((i) => i.googleSubject === sub) ?? null;
  },
  async patch(id, patch) {
    const cur = identities.get(id);
    if (!cur) return null;
    const next: Identity = { ...cur, ...patch, updatedAt: nowIso() };
    identities.set(id, next);
    return next;
  },
  async setStatus(id, status) {
    const cur = identities.get(id);
    if (!cur) return;
    cur.accountStatus = status;
    cur.updatedAt = nowIso();
    await logAudit("identity.status_changed", id, { to: status });
    if (status === "suspended" || status === "banned" || status === "deleted") {
      await revokeAllSessions(id);
    }
  },
  async list() {
    return Array.from(identities.values());
  },
};

// ---- SessionRepo -------------------------------------------------------------
const mockSessionRepoImpl: SessionRepo = {
  async create(identityId) {
    const id = randomUUID();
    const now = Date.now();
    const s: Session = {
      id,
      identityId,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
    };
    sessions.set(id, s);
    return s;
  },
  async get(id) {
    const s = sessions.get(id);
    if (!s) return null;
    if (Date.now() > new Date(s.expiresAt).getTime()) {
      sessions.delete(id);
      return null;
    }
    return s;
  },
  async listForIdentity(identityId) {
    const now = Date.now();
    return [...sessions.values()]
      .filter((s) => s.identityId === identityId)
      .filter((s) => now <= new Date(s.expiresAt).getTime())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async revoke(id) {
    sessions.delete; // no-op ref to keep tree-shake happy
    sessions.delete(id);
  },
  async revokeAllForIdentity(identityId) {
    for (const [k, v] of sessions) if (v.identityId === identityId) sessions.delete(k);
  },
};

/** Create a session for an identity (convenience used by routes + dev). */
export async function createSession(identityId: string): Promise<Session> {
  return mockSessionRepo.create(identityId);
}
export async function revokeSession(id: string): Promise<void> {
  return mockSessionRepo.revoke(id);
}
export async function revokeAllSessions(identityId: string): Promise<void> {
  await mockSessionRepo.revokeAllForIdentity(identityId);
}

// ---- AuthRepo (current identity from session) --------------------------------
const mockAuthRepoImpl = {
  async currentIdentity(sessionId: string | null): Promise<Identity | null> {
    if (!sessionId) return null;
    const s = await mockSessionRepo.get(sessionId);
    if (!s) return null;
    const id = identities.get(s.identityId);
    if (!id) {
      sessions.delete(s.id);
      return null;
    }
    // Only hard-block statuses that must never hold a session.
    // `pending_verification` (post-signup, pre-OTP/consent) MUST keep its
    // session so the user can complete the consent gate — blocking it logs
    // the very first signup out of the flow they're supposed to be in.
    if (id.accountStatus === "suspended" || id.accountStatus === "banned" || id.accountStatus === "deleted") {
      sessions.delete(s.id);
      return null;
    }
    return id;
  },
  async getIdentityById(id: string): Promise<Identity | null> {
    return identities.get(id) ?? null;
  },
};

// ---- ConsentRepo -------------------------------------------------------------
const mockConsentRepoImpl: ConsentRepo = {
  async accept(identityId, method) {
    const id = identities.get(identityId);
    if (!id) return;
    const acc: ConsentAcceptance = {
      termsVersion: CURRENT_TERMS_VERSION,
      privacyVersion: CURRENT_PRIVACY_VERSION,
      acceptedAt: nowIso(),
      method,
    };
    id.consent.push(acc);
    id.updatedAt = nowIso();
    await logAudit("consent.accepted", identityId, {
      termsVersion: acc.termsVersion,
      privacyVersion: acc.privacyVersion,
      method,
    });
  },
  async latest(identityId) {
    const id = identities.get(identityId);
    if (!id || id.consent.length === 0) return null;
    return id.consent[id.consent.length - 1];
  },
  async isCurrent(identityId) {
    const l = await mockConsentRepo.latest(identityId);
    if (!l) return false;
    return (
      l.termsVersion === CURRENT_TERMS_VERSION &&
      l.privacyVersion === CURRENT_PRIVACY_VERSION
    );
  },
};
export async function acceptConsent(identityId: string, method: "email" | "google") {
  return mockConsentRepo.accept(identityId, method);
}
export async function isConsentCurrent(identityId: string) {
  return mockConsentRepo.isCurrent(identityId);
}

// ---- OTP (registration / google_verify / email_change) -----------------------
// In-memory impl (dev / no DATABASE_URL). In production (USE_REAL) the standalone
// issueOtp/verifyOtp below dispatch to realOtpRepo (Neon) instead, so OTPs survive
// cold starts and are consistent across serverless instances.
const mockOtpRepoImpl: OtpRepo = {
  async issue(email, purpose) {
    return issueOtpInMemory(email, purpose);
  },
  async verify(email, code, purpose) {
    return verifyOtpInMemory(email, code, purpose);
  },
  async revoke(email, purpose) {
    otpStore.delete(`${normalizeEmail(email)}:${purpose}`);
  },
};

function issueOtpInMemory(email: string, purpose: OtpPurpose): string {
  const key = `${normalizeEmail(email)}:${purpose}`;
  const list = otpStore.get(key) ?? [];
  const code = String(randomInt(100000, 1000000));
  list.push({ code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
  while (list.length > OTP_MAX_ACTIVE) list.shift();
  otpStore.set(key, list);
  return code;
}

function verifyOtpInMemory(email: string, code: string, purpose: OtpPurpose): boolean {
  const key = `${normalizeEmail(email)}:${purpose}`;
  const list = otpStore.get(key);
  if (!list) return false;
  const now = Date.now();
  const idx = list.findIndex((e) => e.code === code && e.expiresAt > now);
  if (idx === -1) {
    const last = list[list.length - 1];
    if (last) {
      last.attempts += 1;
      if (last.attempts >= OTP_MAX_ATTEMPTS) otpStore.delete(key); // require resend
    }
    return false;
  }
  list.splice(idx, 1); // single-use
  if (list.length === 0) otpStore.delete(key);
  return true;
}

export async function issueOtp(email: string, purpose: OtpPurpose): Promise<string> {
  return (USE_REAL ? realOtpRepo : mockOtpRepoImpl).issue(email, purpose);
}
export async function verifyOtp(
  email: string,
  code: string,
  purpose: OtpPurpose,
): Promise<boolean> {
  return (USE_REAL ? realOtpRepo : mockOtpRepoImpl).verify(email, code, purpose);
}

export async function revokeOtp(email: string, purpose: OtpPurpose): Promise<void> {
  otpStore.delete(`${normalizeEmail(email)}:${purpose}`);
}

/** Dev/test introspection only — returns the latest active OTP for an email+purpose.
 *  NOT used by any production path. The dev route guards it behind NODE_ENV. */
export function peekOtp(email: string, purpose: OtpPurpose): string | null {
  const list = otpStore.get(`${normalizeEmail(email)}:${purpose}`);
  if (!list || list.length === 0) return null;
  const now = Date.now();
  const active = list.filter((e) => e.expiresAt > now);
  return active.length ? active[active.length - 1].code : null;
}

// ---- Magic link (reset ONLY — distinct from OTP) -----------------------------
const mockMagicLinkRepoImpl: MagicLinkRepo = {
  async issue(email) {
    return issueMagicLink(email);
  },
  async consume(token) {
    return consumeMagicLink(token);
  },
};

export async function issueMagicLink(email: string): Promise<string> {
  const token = randomBytes(16).toString("hex");
  magicLinks.set(token, {
    email: normalizeEmail(email),
    expiresAt: Date.now() + MAGIC_LINK_TTL_MS,
    used: false,
  });
  return token;
}

export async function consumeMagicLink(
  token: string,
): Promise<{ ok: boolean; email?: string }> {
  const e = magicLinks.get(token);
  if (!e) return { ok: false };
  if (e.used || e.expiresAt < Date.now()) return { ok: false };
  e.used = true; // single-use
  return { ok: true, email: e.email };
}

/** Dev/test introspection only — returns the live magic-link store entries. */
export function magicLinkEntries(): Map<string, { email: string; expiresAt: number; used: boolean }> {
  return magicLinks;
}

/** Dev/test introspection only — returns the latest reset magic-link token for an email. */
export function peekMagicLink(email: string): string | null {
  const target = normalizeEmail(email);
  let latest: { token: string; expiresAt: number } | null = null;
  for (const [t, v] of magicLinks) {
    if (v.email === target && !v.used && v.expiresAt > Date.now()) {
      if (!latest || v.expiresAt > latest.expiresAt) latest = { token: t, expiresAt: v.expiresAt };
    }
  }
  return latest?.token ?? null;
}

// ---- Pending token (D1: opaque, never raw email in URL) ----------------------
// In-memory impl (dev). In production (USE_REAL) the standalone issuePendingToken/
// consumePendingToken/peekPendingToken dispatch to realPendingTokenRepo (Neon),
// so pending tokens survive cold starts and are consistent across instances.
interface PendingTokenRepoLike {
  issue(email: string, purpose: OtpPurpose): Promise<string>;
  consume(token: string): Promise<PendingToken | null>;
  peek(token: string): Promise<PendingToken | null>;
}

const mockPendingTokenRepoImpl: PendingTokenRepoLike = {
  async issue(email, purpose) {
    const token = randomBytes(16).toString("hex");
    pendingTokens.set(token, {
      token,
      email: normalizeEmail(email),
      purpose,
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + PENDING_TTL_MS).toISOString(),
      used: false,
    });
    return token;
  },
  async consume(token) {
    const t = pendingTokens.get(token);
    if (!t || t.used || Date.now() > new Date(t.expiresAt).getTime()) return null;
    t.used = true;
    return t;
  },
  async peek(token) {
    const t = pendingTokens.get(token);
    if (!t || t.used || Date.now() > new Date(t.expiresAt).getTime()) return null;
    return t;
  },
};

const realPendingTokenRepoLike: PendingTokenRepoLike = {
  async issue(email, purpose) {
    const pt = await realPendingTokenRepo.create({ email, purpose });
    return pt.token;
  },
  async consume(token) {
    const ok = await realPendingTokenRepo.consume(token);
    if (!ok) return null;
    return realPendingTokenRepo.get(token);
  },
  async peek(token) {
    return realPendingTokenRepo.get(token);
  },
};

export async function issuePendingToken(
  email: string,
  purpose: OtpPurpose,
): Promise<string> {
  return (USE_REAL ? realPendingTokenRepoLike : mockPendingTokenRepoImpl).issue(email, purpose);
}
export function consumePendingToken(token: string): PendingToken | null {
  // Synchronous in dev (Map), async-shaped in prod; callers await.
  const repo = USE_REAL ? realPendingTokenRepoLike : mockPendingTokenRepoImpl;
  return repo.consume(token) as PendingToken | null;
}
export function peekPendingToken(token: string): PendingToken | null {
  const repo = USE_REAL ? realPendingTokenRepoLike : mockPendingTokenRepoImpl;
  return repo.peek(token) as PendingToken | null;
}

// ---- Dev helper (Q5): skip the full flow during testing ----------------------
export async function devSignInAs(
  role: "shopper" | "vendor" | "admin",
): Promise<{ sessionId: string; identity: Identity }> {
  const email = `dev-${role}@voeq.ng`;
  let id = await mockIdentityRepo.getByEmail(email);
  if (!id) {
    id = await mockIdentityRepo.createPending({
      email,
      name: `Dev ${role[0].toUpperCase()}${role.slice(1)}`,
      passwordHash: null,
      method: "email",
      intent: role === "admin" ? "shopper" : role,
    });
  }
  id =
    (await mockIdentityRepo.patch(id.id, {
      accountStatus: "active",
      emailVerified: true,
      campus: id.campus ?? "nmu",
      role,
      intent: role === "admin" ? "shopper" : role,
    })) ?? id;
  if (!(await mockConsentRepo.isCurrent(id.id))) {
    await mockConsentRepo.accept(id.id, "email");
  }
  const s = await createSession(id.id);
  await logAudit("dev.sign_in_as", id.id, { role });
  return { sessionId: s.id, identity: id };
}

/**
 * Dev/test-only: wipe ALL in-memory auth stores so a harness can start clean
 * between assertions. No production path imports this. (The real Phase 9 store
 * won't have this — isolation comes from per-test DB transactions.)
 */
export function resetAuthState(): void {
  identities.clear();
  sessions.clear();
  pendingTokens.clear();
  otpStore.clear();
  magicLinks.clear();
}

// ---- UserPreferenceRepo (VS3.1) ---------------------------------------------
const userPrefs = new Map<string, UserPreference>();

const mockUserPrefRepoImpl: UserPreferenceRepo = {
  async get(identityId) {
    return userPrefs.get(identityId) ?? null;
  },
  async save({ identityId, campus, interestTags, feedPrefsSetAt, notificationPrefs }) {
    const existing = userPrefs.get(identityId);
    const updated: UserPreference = {
      identityId,
      campus: campus ?? existing?.campus ?? "",
      notificationPrefs: notificationPrefs ?? existing?.notificationPrefs ?? {},
      interestTags: interestTags ?? existing?.interestTags ?? [],
      feedPrefsSetAt: feedPrefsSetAt !== undefined ? feedPrefsSetAt : existing?.feedPrefsSetAt ?? null,
      updatedAt: nowIso(),
    };
    userPrefs.set(identityId, updated);
    return updated;
  },
};

/** Dev/test-only: wipe user-preference store (companion to resetAuthState). */
export function resetUserPrefs(): void {
  userPrefs.clear();
}

/**
 * VS7.24 — Prune expired credentials (OTP codes, magic links, pending tokens).
 * Real backend (Phase 9) runs this on a schedule; here it's a manual/in-process pass.
 */
export function pruneExpiredCredentials(now: number = Date.now()): number {
  let removed = 0;
  for (const [key, list] of otpStore) {
    const live = list.filter((e) => e.expiresAt > now);
    if (live.length !== list.length) removed += list.length - live.length;
    if (live.length === 0) otpStore.delete(key);
    else otpStore.set(key, live);
  }
  for (const [token, v] of magicLinks) {
    if (v.expiresAt <= now || v.used) { magicLinks.delete(token); removed++; }
  }
  for (const [token, v] of pendingTokens) {
    if (new Date(v.expiresAt).getTime() <= now) { pendingTokens.delete(token); removed++; }
  }
  return removed;
}

// D.2/D.3 — Factory (appended at EOF so all `Impl` consts are declared above).
// When DATABASE_URL is set, the `mock*` names transparently resolve to the real
// Neon-backed repos. No route imports change.
const USE_REAL = !!process.env.DATABASE_URL;
export const mockIdentityRepo = USE_REAL ? (realIdentityRepo as unknown as IdentityRepo) : mockIdentityRepoImpl;
export const mockSessionRepo = USE_REAL ? (realSessionRepo as unknown as SessionRepo) : mockSessionRepoImpl;
export const mockOtpRepo = USE_REAL ? (realOtpRepo as unknown as OtpRepo) : mockOtpRepoImpl;
export const mockMagicLinkRepo = USE_REAL ? (realMagicLinkRepo as unknown as MagicLinkRepo) : mockMagicLinkRepoImpl;
export const mockConsentRepo = USE_REAL ? (realConsentRepo as unknown as ConsentRepo) : mockConsentRepoImpl;
export const mockAuthRepo = USE_REAL ? (realAuthRepo as unknown as AuthRepo) : mockAuthRepoImpl;
export const mockUserPrefRepo = USE_REAL ? (realUserPreferenceRepo as unknown as UserPreferenceRepo) : mockUserPrefRepoImpl;
