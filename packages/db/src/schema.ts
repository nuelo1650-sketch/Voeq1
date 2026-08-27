/**
 * D.2 — Drizzle schema generated from packages/data/src/interfaces.ts.
 *
 * One table per storable entity. Derived analytics (VendorAnalytics /
 * PlatformAnalytics) are NOT stored — they're computed at read time, per the
 * interface contract. JSON columns back the Record/array fields
 * (consent, lastSeen, categoryIds, socials, hours, notificationPrefs).
 *
 * Driver: @neondatabase/serverless (works on Render Node runtime + Vercel edge).
 */
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  pgEnum,
  doublePrecision,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ---- Enums (mirror interface unions) ----------------------------------------
export const accountStatus = pgEnum("account_status", [
  "pending_verification",
  "active",
  "suspended",
  "banned",
  "deleted",
]);
export const authMethod = pgEnum("auth_method", ["email", "google"]);
export const userRole = pgEnum("user_role", ["shopper", "vendor", "admin"]);
export const otpPurpose = pgEnum("otp_purpose", ["registration", "google_verify", "email_change"]);
export const messageState = pgEnum("message_state", ["pending", "sent", "delivered", "read", "failed"]);
export const reportCategory = pgEnum("report_category", [
  "not_on_campus",
  "scam",
  "inappropriate",
  "impersonation",
  "harassment",
  "other",
]);

// ---- Identity & access -------------------------------------------------------
export const identities = pgTable("identities", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  googleSubject: text("google_subject").unique(),
  method: authMethod("method").notNull().default("email"),
  role: userRole("role").notNull().default("shopper"),
  staffRole: text("staff_role"),
  intent: text("intent"),
  accountStatus: accountStatus("account_status").notNull().default("pending_verification"),
  emailVerified: boolean("email_verified").notNull().default(false),
  campus: text("campus"),
  // consent is an array on the Identity interface -> JSONB column.
  consent: jsonb("consent").$type<
    { termsVersion: string; privacyVersion: string; acceptedAt: string; method: "email" | "google" }[]
  >().notNull().default([]),
  vendorId: text("vendor_id"),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  identityId: text("identity_id").notNull(),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
});

export const pendingTokens = pgTable("pending_tokens", {
  token: text("token").primaryKey(),
  email: text("email").notNull(),
  purpose: otpPurpose("purpose").notNull(),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
});

export const otps = pgTable("otps", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  purpose: otpPurpose("purpose").notNull(),
  code: text("code").notNull(),
  expiresAt: text("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
});

export const magicLinks = pgTable("magic_links", {
  token: text("token").primaryKey(),
  email: text("email").notNull(),
  expiresAt: text("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
});

export const userPreferences = pgTable("user_preferences", {
  identityId: text("identity_id").primaryKey(),
  campus: text("campus").notNull(),
  notificationPrefs: jsonb("notification_prefs").$type<Record<string, string>>().notNull().default({}),
  interestTags: jsonb("interest_tags").$type<string[]>().notNull().default([]),
  feedPrefsSetAt: text("feed_prefs_set_at"),
  updatedAt: text("updated_at").notNull(),
});

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  identityId: text("identity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  adminAction: boolean("admin_action").notNull().default(false),
  at: text("at").notNull(),
});

// ---- Marketplace ------------------------------------------------------------
export const vendors = pgTable("vendors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  handle: text("handle").notNull(),
  campus: text("campus").notNull(),
  categoryIds: jsonb("category_ids").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("pending_listings"),
  verified: boolean("verified").notNull().default(false),
  description: text("description").notNull().default(""),
  subArea: text("sub_area"),
  profilePhotoUrl: text("profile_photo_url"),
  hours: jsonb("hours").$type<
    { open: string; close: string; days: string[] } | null
  >(),
  socials: jsonb("socials").$type<
    { phone?: string; instagram?: string; twitter?: string; tiktok?: string } | null
  >(),
  agreementVersion: text("agreement_version"),
  agreementAcceptedAt: text("agreement_accepted_at"),
  identityId: text("identity_id"),
  slug: text("slug").notNull(),
});

export const listings = pgTable("listings", {
  id: text("id").primaryKey(),
  vendorId: text("vendor_id").notNull(),
  title: text("title").notNull(),
  priceMinor: integer("price_minor").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  priceMinMinor: integer("price_min_minor").notNull(),
  priceMaxMinor: integer("price_max_minor"),
  categoryId: text("category_id").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  isFeatured: boolean("is_featured").notNull().default(false),
  featuredUntil: text("featured_until"),
});

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey(),
  vendorId: text("vendor_id").notNull(),
  authorId: text("author_id").notNull(),
  rating: integer("rating").notNull(),
  body: text("body").notNull().default(""),
  createdAt: text("created_at").notNull(),
  response: jsonb("response").$type<
    { body: string; createdAt: string; editedAt: string | null } | null
  >(),
  status: text("status").notNull().default("visible"),
});

export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  participantIds: jsonb("participant_ids").$type<string[]>().notNull().default([]),
  lastMessageAt: text("last_message_at").notNull(),
  createdAt: text("created_at").notNull(),
  lastSeen: jsonb("last_seen").$type<Record<string, string>>().notNull().default({}),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull(),
  senderId: text("sender_id").notNull(),
  body: text("body").notNull(),
  state: messageState("state").notNull().default("sent"),
  createdAt: text("created_at").notNull(),
  readAt: text("read_at"),
  clientMsgId: text("client_msg_id"),
});

export const staffCases = pgTable("staff_cases", {
  id: text("id").primaryKey(),
  queue: text("queue").notNull(),
  decision: text("decision"),
  consequence: text("consequence"),
  status: text("status").notNull().default("open"),
  assignedTo: text("assigned_to"),
  resolution: text("resolution"),
});

export const wishlistItems = pgTable("wishlist_items", {
  id: text("id").primaryKey(),
  shopperId: text("shopper_id").notNull(),
  listingId: text("listing_id"),
  vendorId: text("vendor_id"),
  createdAt: text("created_at").notNull(),
});

export const follows = pgTable("follows", {
  id: text("id").primaryKey(),
  followerId: text("follower_id").notNull(),
  vendorId: text("vendor_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const likes = pgTable("likes", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").notNull(),
  targetId: text("target_id").notNull(),
  targetType: text("target_type").notNull(),
  createdAt: text("created_at").notNull(),
});

export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull(),
  authorId: text("author_id").notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull(),
  status: text("status").notNull().default("published"),
});

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  reporterId: text("reporter_id").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  category: reportCategory("category").notNull(),
  body: text("body"),
  status: text("status").notNull().default("open"),
  createdAt: text("created_at").notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  recipientId: text("recipient_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  refId: text("ref_id"),
  read: boolean("read").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const agreements = pgTable("agreements", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  version: text("version").notNull(),
  body: text("body").notNull(),
  effectiveAt: text("effective_at").notNull(),
  isCurrent: boolean("is_current").notNull().default(false),
});

export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  value: boolean("value").notNull().default(false),
  description: text("description").notNull().default(""),
});

export const activityEvents = pgTable("activity_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  campusZone: text("campus_zone").notNull(),
  refId: text("ref_id").notNull(),
  ts: text("ts").notNull(),
});

// ---- Campuses (extended for user-extensible, geocoded data) ----------------
// NOTE: `slug` is UNIQUE (enforced by SQL migration 0002_campus_overhaul).
export const campusSource = pgEnum("campus_source", ["seeded", "user-added"]);
export const campusStatus = pgEnum("campus_status", ["verified", "unverified"]);

export const campuses = pgTable(
  "campuses",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    region: text("region"),
    // Extended fields (migration 0002_campus_overhaul)
    city: text("city"),
    state: text("state"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    source: campusSource("source").notNull().default("seeded"),
    status: campusStatus("status").notNull().default("verified"),
    createdByUserId: text("created_by_user_id"),
    createdAt: text("created_at").notNull(),
  },
  (t) => ({
    slugUnique: uniqueIndex("campuses_slug_unique").on(t.slug),
    statusSlugIdx: index("campuses_status_slug_idx").on(t.status, t.slug),
  }),
);

// ---- Nominatim throttle (server-side shared 1 req/sec gate) -----------------
// Single-row table. The route handler atomically claims the slot via
// `UPDATE ... WHERE now() - last_request_at >= interval '1100 ms' RETURNING`.
// Shared across all instances/processes (Render multi-instance + Vercel proxy).
export const nominatimThrottle = pgTable("nominatim_throttle", {
  id: integer("id").primaryKey().default(1),
  lastRequestAt: timestamp("last_request_at", { withTimezone: true }).notNull().default(new Date(0)),
  lastRequestBy: text("last_request_by"),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
});
