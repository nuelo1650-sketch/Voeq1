import { pgTable, text, integer, jsonb } from "drizzle-orm/pg-core";

/**
 * Listing integrity system (2026-09-05, David-approved design).
 *
 * Append-only audit of every Tier-B edit attempt on a listing — applied,
 * flagged, or blocked. Same philosophy as auth_events: the platform can
 * always answer "what did this listing used to be?"
 *
 * similarity: 0-100 word-level score (title diff 40% + category 25% +
 *   price band 20% + description overlap 15%). <40 = different product.
 * engagementSnapshot: like/comment/save/conversation/view counts at edit time.
 * action: applied | flagged | blocked
 */
export const listingEdits = pgTable("listing_edits", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull(),
  vendorId: text("vendor_id").notNull(),
  at: text("at").notNull(),
  fields: jsonb("fields").$type<Record<string, { from: unknown; to: unknown }>>().notNull(),
  similarity: integer("similarity"),
  engagement: jsonb("engagement").$type<{
    likes: number; comments: number; saves: number; conversations: number; views: number;
  }>().notNull(),
  action: text("action").notNull(),
});

export type ListingEditRow = typeof listingEdits.$inferSelect;
