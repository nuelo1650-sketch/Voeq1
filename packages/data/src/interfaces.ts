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
  /** VS3.2 (Reversal 7): onboarding lifecycle. pending_listings = account exists, NOT public. live = public.
   *  suspended = staff suspended the STOREFRONT only (browse allowed, edit/message disabled). Distinct
   *  from Identity.accountStatus='suspended' (account-level, blocks login entirely). VS5.14. */
  status: "pending_listings" | "live" | "suspended";
  /** VS7.8: staff verification flag (distinct from lifecycle status). */
  verified: boolean;
  /** VS3.2: business description (Doc 08 §8.4 business layer; min 50 chars enforced at API). */
  description: string;
  /** VS3.2: campus sub-area (hostel/faculty) — optional. */
  subArea: string | null;
  /** VS3.4: profile photo (Cloudinary mock URL). Null until uploaded. */
  profilePhotoUrl: string | null;
  /** VS5.3: operating hours. Null until set — "Open now" badge only renders when present (honest). */
  hours?: { open: string; close: string; days: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[] } | null;
  /** VS5.3: contact socials (phone allowed; WhatsApp BANNED per Doc 13 §13.13). */
  socials?: { phone?: string; instagram?: string; twitter?: string; tiktok?: string } | null;
  /** VS3.2: Vendor Agreement version accepted (null until Phase A step 3). */
  agreementVersion: string | null;
  agreementAcceptedAt: string | null;
  /** VS3.2/3.6: links this Vendor to the ONE Identity (one account, role widens). */
  identityId: string | null;
  /** URL-safe slug for storefront routing. */
  slug: string;
}

export interface Listing {
  id: string;
  vendorId: string;
  title: string;
  priceMinor: number;
  isPublished: boolean;
  images: string[];
  /** VS3.4: price range (min required, max optional). Migrated from priceMinor. */
  priceMinMinor: number;
  priceMaxMinor: number | null;
  categoryId: string;
  description: string | null;
  /** VS3.4: listing lifecycle. active = publicly listed. */
  status: "active" | "removed";
  /** VS7.9: staff feature flag (surfaces listing in highlights). */
  isFeatured: boolean;
  /** VS7.9: expiry of the feature (null if not featured). */
  featuredUntil?: string | null;
}

export interface VendorRepo {
  listVendors(params?: { campus?: string }): Promise<Vendor[]>;
  getById(id: string): Promise<Vendor | null>;
  getByIdentityId(identityId: string): Promise<Vendor | null>;
  create(input: Partial<Vendor> & { identityId: string; name: string; campus: string; categoryIds: string[] }): Promise<Vendor>;
  patch(id: string, patch: Partial<Vendor>): Promise<Vendor | null>;
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
  authorId: string; // = identityId
  rating: number; // 1-5
  body: string;
  createdAt: string;
  /** VS5.10: vendor's response to this review. One response per review, editable ≤24h. */
  response?: {
    body: string;
    createdAt: string;
    editedAt: string | null;
  } | null;
  /** VS7.10: moderation state. visible by default; hidden removes it from public display. */
  status: "visible" | "hidden";
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessageAt: string;
  /** VS6.4: creation time for ordering + UI. */
  createdAt: string;
  /** VS6.16: honest last-seen per participant (identityId -> ISO ts). */
  lastSeen: Record<string, string>;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  state: "pending" | "sent" | "delivered" | "read" | "failed";
  createdAt: string;
  /** VS6.9: read timestamp (recipient perspective). null until read. */
  readAt?: string | null;
  /** VS6.6: sender-side idempotency key (Doc 09 §9.8 Tier B). Dedupes rapid resends. */
  clientMsgId?: string;
}

/** VS6 — Message lifecycle states (server-authoritative). */
export type MessageState = "pending" | "sent" | "delivered" | "read" | "failed";

export interface StaffCase {
  id: string;
  queue: string;
  decision: string | null;
  consequence: string | null;
  /** VS7.1: triage/assignment. */
  status: "open" | "triaged" | "resolved" | "dismissed";
  assignedTo?: string | null; // identityId of handling staff
  resolution?: string | null; // free-text resolution
}

export interface ListingsRepo {
  list(params?: { campus?: string; category?: string }): Promise<Listing[]>;
  getById(id: string): Promise<Listing | null>;
  create(input: Partial<Listing> & { vendorId: string; title: string; priceMinMinor: number; categoryId: string }): Promise<Listing>;
  /** VS5.7: edit a listing (inline form). Ownership enforced by caller. */
  update(id: string, patch: Partial<Listing>): Promise<Listing | null>;
  /** Remove a listing (VS3 audit fix: enables visibility reversion on delete). */
  remove(id: string): Promise<boolean>;
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
  /** VS7.12: list all messages (analytics). */
  listAll(): Promise<Message[]>;
}

export interface StaffRepo {
  create(input: { queue: string; decision: string | null; consequence: string | null }): Promise<StaffCase>;
  listCases(queue: string): Promise<StaffCase[]>;
  /** VS7.1: triage mutations. */
  assignCase(caseId: string, assignedTo: string): Promise<StaffCase | null>;
  resolveCase(caseId: string, resolution: string, status?: "resolved" | "dismissed"): Promise<StaffCase | null>;
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
  /** VS7.1: staff capability tier. Additive to shopper+vendor; null = not staff. */
  staffRole?: "moderator" | "admin" | "super_admin" | null;
  intent: "shopper" | "vendor" | null; // registration intent
  accountStatus: AccountStatus;
  emailVerified: boolean;
  campus: string | null; // null until /select-campus
  consent: ConsentAcceptance[];
  /** VS3.2/3.6: the linked Vendor record (null until Phase A complete). Role widens to 'vendor' on canGoLive. */
  vendorId: string | null;
  /** Profile picture URL (Cloudinary), set via account settings. null = default avatar. */
  avatarUrl?: string | null;
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
  /** VS3.1: shopper feed-preference capture gate (Doc 08 §8.3). null until set. */
  interestTags: string[];
  feedPrefsSetAt: string | null;
  updatedAt: string;
}

export interface UserPreferenceRepo {
  get(identityId: string): Promise<UserPreference | null>;
  save(input: {
    identityId: string;
    campus?: string;
    interestTags?: string[];
    feedPrefsSetAt?: string | null;
    notificationPrefs?: Record<string, NotificationPref>;
  }): Promise<UserPreference>;
}

export interface AuditEntry {
  id: string;
  type: string;
  identityId: string | null;
  metadata: Record<string, unknown>; // MUST NOT contain PII (email/name/phone)
  /** VS7.1: marks admin/staff actions for quick filtering in the audit viewer. */
  adminAction?: boolean;
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
  /** VS7.12: list all identities (analytics only; mock-backed). */
  list(): Promise<Identity[]>;
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
  /** Read-only lookup for attribution (comments/reviews display names). No PII beyond name. */
  getIdentityById(id: string): Promise<Identity | null>;
}

// ---- Shopper relationship types (VS4) --------------------------------------
// Appended net-new (LOCKED interfaces.ts: extend-only). No existing shape modified.

/** Saved listing OR vendor (mutually exclusive per Doc 08 §8.7). */
export interface WishlistItem {
  id: string;
  shopperId: string; // = identityId
  listingId: string | null;
  vendorId: string | null;
  createdAt: string;
}

export interface Follow {
  id: string;
  followerId: string; // = identityId
  vendorId: string;
  createdAt: string;
}

export interface Like {
  id: string;
  actorId: string; // = identityId
  targetId: string;
  targetType: "listing" | "vendor";
  createdAt: string;
}

export interface Comment {
  id: string;
  listingId: string;
  authorId: string; // = identityId
  body: string;
  createdAt: string;
  /** Moderation lifecycle (Doc 13 — honest, no auto-hide of legit content). */
  status: "published" | "hidden" | "flagged";
}

export type ReportCategory =
  | "not_on_campus"
  | "scam"
  | "inappropriate"
  | "impersonation"
  | "harassment"
  | "other";

export interface Report {
  id: string;
  reporterId: string; // = identityId
  targetType: "listing" | "vendor" | "message";
  targetId: string;
  category: ReportCategory;
  body: string | null;
  status: "open" | "triaged" | "actioned" | "dismissed";
  createdAt: string;
}

export type NotificationType =
  | "new_message"
  | "new_review"
  | "review_response"
  | "new_follower"
  | "system";

export interface Notification {
  id: string;
  recipientId: string; // = identityId
  type: NotificationType;
  title: string;
  body: string;
  refId: string | null;
  read: boolean;
  createdAt: string;
}

export interface SavedListingRepo {
  /** Toggle: if saved, remove; else add. Returns the resulting saved state. */
  toggle(input: { shopperId: string; targetType: "listing" | "vendor"; targetId: string }): Promise<{ saved: boolean; item?: WishlistItem }>;
  list(shopperId: string): Promise<WishlistItem[]>;
}

export interface FollowRepo {
  /** Toggle: if following, unfollow; else follow. Returns resulting state. */
  toggle(input: { followerId: string; vendorId: string }): Promise<{ following: boolean; follow?: Follow }>;
  list(followerId: string): Promise<Follow[]>;
  /** VS5.12: who follows a given vendor (for the vendor's own follower view). */
  listByVendor(vendorId: string): Promise<Follow[]>;
}

export interface LikeRepo {
  toggle(input: { actorId: string; targetId: string; targetType: "listing" | "vendor" }): Promise<{ liked: boolean; like?: Like }>;
  list(actorId: string): Promise<Like[]>;
}

export interface ReviewRepo {
  /** Upsert: one review per (shopperId, vendorId) per Doc 09 §9.8. */
  create(input: { shopperId: string; vendorId: string; rating: number; body: string }): Promise<Review>;
  listByVendor(vendorId: string): Promise<Review[]>;
  getById(id: string): Promise<Review | null>;
  /** VS5.10: vendor responds to a review on their own storefront. One response per review. */
  respond(reviewId: string, vendorId: string, body: string): Promise<Review | null>;
  /** VS7.10: moderation (hide/show) via status patch. */
  patch(id: string, patch: Partial<Review>): Promise<Review | null>;
  /** VS7.12: list all reviews (analytics). */
  listAll(): Promise<Review[]>;
}

export interface CommentRepo {
  create(input: { listingId: string; authorId: string; body: string }): Promise<Comment>;
  listByListing(listingId: string): Promise<Comment[]>;
  getById(id: string): Promise<Comment | null>;
}

export interface ReportRepo {
  create(input: { reporterId: string; targetType: "listing" | "vendor" | "message"; targetId: string; category: ReportCategory; body: string | null }): Promise<Report>;
  list(): Promise<Report[]>;
}

export interface NotificationRepo {
  create(input: { recipientId: string; type: NotificationType; title: string; body: string; refId?: string | null }): Promise<Notification>;
  list(recipientId: string): Promise<Notification[]>;
  markRead(id: string, recipientId: string): Promise<boolean>;
  markAllRead(recipientId: string): Promise<boolean>;
}

/**
 * VS5.11 — DERIVED vendor analytics (not stored; computed from existing repos).
 * No impression log in VS5: counts come from real relationship records.
 * openNow is derived from Vendor.hours + current time; null if hours unset (honest).
 */
/** VS7.12 — Platform-wide analytics. All counts derived from real records (no fake metrics). */
export interface PlatformAnalytics {
  userCount: number;
  vendorCount: number;
  listingCount: number;
  reviewCount: number;
  openReports: number;
  messageVolume24h: number;
  newSignups24h: number;
  staffCount: number;
}

/** VS7.19 — Feature flag (mock config). */
export interface FeatureFlag {
  key: string;
  value: boolean;
  description: string;
}

/** VS7.18 — Platform agreement version (terms/privacy/etc.). */
export interface Agreement {
  id: string;
  kind: "terms" | "privacy" | "vendor";
  version: string;
  body: string;
  effectiveAt: string;
  isCurrent: boolean;
}

export interface AgreementRepo {
  list(kind?: Agreement["kind"]): Promise<Agreement[]>;
  create(input: { kind: Agreement["kind"]; version: string; body: string }): Promise<Agreement>;
  setCurrent(id: string): Promise<Agreement | null>;
}

export interface VendorAnalytics {
  vendorId: string;
  listingCount: number;
  reviewCount: number;
  followerCount: number;
  saveCount: number;
  ratingAvg: number;
  openNow: boolean | null;
}

/**
 * VS6.1 — Image upload context. Drives context-aware validation/size limits in
 * the shared `images.ts` module. `message_attachment` is reserved for Phase 1+
 * (image attachments are OUT of Phase 1 per founder lock — context declared, not wired).
 */
export type ImageContext = "vendor_photo" | "listing_photo" | "message_attachment";

/** VS6.1 — Result of a moderated upload. Server-authoritative moderation outcome. */
export type UploadResult =
  | { ok: true; url: string; publicId: string; context: ImageContext }
  | { ok: false; reason: string; retryable: boolean };
