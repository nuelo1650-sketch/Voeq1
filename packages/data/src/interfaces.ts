/**
 * Repository interfaces — the migration contract (Doc 07 §7.7 / §7.8).
 *
 * These are SHAPES ONLY. The real backend (Phase 9) fulfills these signatures;
 * the UI imports the interface, never the implementation. Slice 0 provides a trivial
 * mock (mock.ts) so the boundary exists before any backend. B.16-shaped fixtures
 * (15 listings, ≥5 imperfect photos) are a Slice 4 concern and are intentionally
 * NOT present here.
 */

export interface Vendor {
  id: string;
  name: string;
  handle: string;
  campus: string;
  categoryIds: string[];
}

export interface Listing {
  id: string;
  vendorId: string;
  title: string;
  priceMinor: number;
  isPublished: boolean;
  images: string[];
}

export interface ActivityEvent {
  id: string;
  type: string;
  campusZone: string;
  refId: string;
  ts: string;
}

export interface Review {
  id: string;
  vendorId: string;
  authorId: string;
  rating: number;
  body: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessageAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  state: "pending" | "sent" | "delivered" | "failed";
  createdAt: string;
}

export interface StaffCase {
  id: string;
  queue: string;
  decision: string | null;
  consequence: string | null;
}

export interface ListingsRepo {
  list(params?: { campus?: string; category?: string }): Promise<Listing[]>;
  getById(id: string): Promise<Listing | null>;
}

export interface VendorsRepo {
  listVendors(params?: { campus?: string }): Promise<Vendor[]>;
  getById(id: string): Promise<Vendor | null>;
}

export interface ActivityRepo {
  recent(campusZone: string, limit?: number): Promise<ActivityEvent[]>;
}

export interface AuthRepo {
  currentIdentity(): Promise<{ id: string; capabilities: string[] } | null>;
}

export interface MessagesRepo {
  listConversations(identityId: string): Promise<Conversation[]>;
}

export interface StaffRepo {
  listCases(queue: string): Promise<StaffCase[]>;
}

export interface SearchRepo {
  search(query: string): Promise<Listing[]>;
}

// ---- Auth / Identity & Access (VS2) -----------------------------------------
// Added in Slice 2 (Identity & Access). Pre-existing interfaces above are
// UNCHANGED (LOCKED shapes). These are net-new domain contracts per Doc 08 §8.3.

export type AuthMethod = "email" | "google";
export type UserRole = "shopper" | "vendor" | "admin";
export type AccountStatus =
  | "pending_verification"
  | "active"
  | "suspended"
  | "banned"
  | "deleted";
export type OtpPurpose = "registration" | "google_verify" | "email_change";
export type NotificationPref = "email" | "in_app" | "none";

export interface ConsentAcceptance {
  termsVersion: string;
  privacyVersion: string;
  acceptedAt: string; // server timestamp (ISO)
  method: AuthMethod;
}

export interface Identity {
  id: string;
  email: string; // normalized lowercase
  name: string;
  passwordHash: string | null; // null for google-only until set
  googleSubject: string | null; // Google "sub"
  method: AuthMethod;
  role: UserRole; // one identity, role property (Doc 07 §7.9)
  intent: "shopper" | "vendor" | null; // registration intent
  accountStatus: AccountStatus;
  emailVerified: boolean;
  campus: string | null; // null until /select-campus
  consent: ConsentAcceptance[];
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string; // opaque cookie value
  identityId: string;
  createdAt: string;
  expiresAt: string;
}

export interface PendingToken {
  token: string; // random nonce (D1: never raw email in URL)
  email: string;
  purpose: OtpPurpose;
  createdAt: string;
  expiresAt: string;
  used: boolean;
}

export interface UserPreference {
  identityId: string;
  campus: string;
  notificationPrefs: Record<string, NotificationPref>;
  onboardingInterests: string[];
  updatedAt: string;
}

export interface AuditEntry {
  id: string;
  type: string;
  identityId: string | null;
  metadata: Record<string, unknown>; // MUST NOT contain PII (email/name/phone)
  at: string;
}

export interface IdentityRepo {
  createPending(input: {
    email: string;
    name: string;
    passwordHash: string | null;
    method: AuthMethod;
    intent: "shopper" | "vendor" | null;
    googleSubject?: string | null;
  }): Promise<Identity>;
  getByEmail(email: string): Promise<Identity | null>;
  getById(id: string): Promise<Identity | null>;
  getByGoogleSubject(sub: string): Promise<Identity | null>;
  patch(id: string, patch: Partial<Identity>): Promise<Identity | null>;
  setStatus(id: string, status: AccountStatus): Promise<void>;
}

export interface SessionRepo {
  create(identityId: string): Promise<Session>;
  get(id: string): Promise<Session | null>;
  revoke(id: string): Promise<void>;
  revokeAllForIdentity(identityId: string): Promise<void>;
}

export interface ConsentRepo {
  accept(identityId: string, method: AuthMethod): Promise<void>;
  latest(identityId: string): Promise<ConsentAcceptance | null>;
  isCurrent(identityId: string): Promise<boolean>;
}

export interface OtpRepo {
  issue(email: string, purpose: OtpPurpose): Promise<string>; // returns code (mock)
  verify(email: string, code: string, purpose: OtpPurpose): Promise<boolean>;
  revoke(email: string, purpose: OtpPurpose): Promise<void>;
}

export interface MagicLinkRepo {
  issue(email: string): Promise<string>; // returns token
  consume(token: string): Promise<{ ok: boolean; email?: string }>;
}

export interface RateLimitStore {
  check(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<{ allowed: boolean; retryAfterMs: number }>;
}

export interface AuditStore {
  log(entry: Omit<AuditEntry, "id" | "at">): Promise<void>;
  query(filter?: {
    type?: string;
    identityId?: string;
    limit?: number;
  }): Promise<AuditEntry[]>;
}

// Expanded (was: currentIdentity(): Promise<{ id: string; capabilities: string[] } | null>)
export interface AuthRepo {
  currentIdentity(sessionId: string | null): Promise<Identity | null>;
}
