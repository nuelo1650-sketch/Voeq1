/**
 * Staff admin cleanup (2026-08-31) — lives in packages/db so ALL drizzle
 * API calls use the SAME drizzle-orm instance as the schema (apps/web has its
 * own copy; mixing instances produced SQL type mismatches).
 *
 * Schema has NO FK ON DELETE CASCADE (plain text ids), so child rows are removed
 * FIRST in explicit child->parent order. Column names match schema.ts exactly
 * (likes/reports polymorphic; conversations JSONB participantIds; follows
 * followerId; comments/reviews authorId; notifications recipientId; otps/magicLinks email).
 */
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "./client";
import * as s from "./schema";

export type AdminCleanupOp = "delete-listing" | "delete-vendor" | "delete-identity";

export async function adminCleanup(op: AdminCleanupOp, target: { listingId?: string; vendorId?: string; identityId?: string }): Promise<void> {
  const db = getDb();

  if (op === "delete-listing") {
    const listingId = target.listingId?.trim();
    if (!listingId) throw new Error("missing_listingId");
    await db.delete(s.likes).where(and(eq(s.likes.targetType, "listing"), eq(s.likes.targetId, listingId)));
    await db.delete(s.reports).where(and(eq(s.reports.targetType, "listing"), eq(s.reports.targetId, listingId)));
    await db.delete(s.comments).where(eq(s.comments.listingId, listingId));
    await db.delete(s.wishlistItems).where(eq(s.wishlistItems.listingId, listingId));
    await db.delete(s.listings).where(eq(s.listings.id, listingId));
    return;
  }

  if (op === "delete-vendor") {
    const vendorId = target.vendorId?.trim();
    if (!vendorId) throw new Error("missing_vendorId");
    const vendor = (await db.select().from(s.vendors).where(eq(s.vendors.id, vendorId)).limit(1))[0];
    if (!vendor) throw new Error("vendor_not_found");

    const listingIds = (await db.select({ id: s.listings.id }).from(s.listings).where(eq(s.listings.vendorId, vendorId))).map((r) => r.id);
    if (listingIds.length) {
      await db.delete(s.likes).where(and(inArray(s.likes.targetId, listingIds), eq(s.likes.targetType, "listing")));
      await db.delete(s.reports).where(and(inArray(s.reports.targetId, listingIds), eq(s.reports.targetType, "listing")));
      await db.delete(s.comments).where(inArray(s.comments.listingId, listingIds));
    }
    await db.delete(s.wishlistItems).where(eq(s.wishlistItems.vendorId, vendorId));
    await db.delete(s.follows).where(eq(s.follows.vendorId, vendorId));
    await db.delete(s.reviews).where(eq(s.reviews.vendorId, vendorId));
    if (vendor.identityId) {
      const convIds = (
        await db
          .select({ id: s.conversations.id })
          .from(s.conversations)
          .where(sql`participant_ids @> ${JSON.stringify([vendor.identityId])}::jsonb`)
      ).map((r) => r.id);
      if (convIds.length) {
        await db.delete(s.messages).where(inArray(s.messages.conversationId, convIds));
        await db.delete(s.conversations).where(inArray(s.conversations.id, convIds));
      }
    }
    if (listingIds.length) await db.delete(s.listings).where(inArray(s.listings.id, listingIds));
    await db.delete(s.vendors).where(eq(s.vendors.id, vendorId));
    return;
  }

  if (op === "delete-identity") {
    const identityId = target.identityId?.trim();
    if (!identityId) throw new Error("missing_identityId");
    const identity = (await db.select().from(s.identities).where(eq(s.identities.id, identityId)).limit(1))[0];
    if (!identity) throw new Error("identity_not_found");

    const vendor = (await db.select().from(s.vendors).where(eq(s.vendors.identityId, identityId)).limit(1))[0];
    if (vendor) {
      const listingIds = (await db.select({ id: s.listings.id }).from(s.listings).where(eq(s.listings.vendorId, vendor.id))).map((r) => r.id);
      if (listingIds.length) {
        await db.delete(s.likes).where(and(inArray(s.likes.targetId, listingIds), eq(s.likes.targetType, "listing")));
        await db.delete(s.reports).where(and(inArray(s.reports.targetId, listingIds), eq(s.reports.targetType, "listing")));
        await db.delete(s.comments).where(inArray(s.comments.listingId, listingIds));
      }
      await db.delete(s.wishlistItems).where(eq(s.wishlistItems.vendorId, vendor.id));
      await db.delete(s.follows).where(eq(s.follows.vendorId, vendor.id));
      await db.delete(s.reviews).where(eq(s.reviews.vendorId, vendor.id));
      if (listingIds.length) await db.delete(s.listings).where(inArray(s.listings.id, listingIds));
      await db.delete(s.vendors).where(eq(s.vendors.id, vendor.id));
    }

    await db.delete(s.follows).where(eq(s.follows.followerId, identityId));
    await db.delete(s.wishlistItems).where(eq(s.wishlistItems.shopperId, identityId));
    await db.delete(s.likes).where(eq(s.likes.actorId, identityId));
    await db.delete(s.comments).where(eq(s.comments.authorId, identityId));
    await db.delete(s.reviews).where(eq(s.reviews.authorId, identityId));
    await db.delete(s.reports).where(eq(s.reports.reporterId, identityId));
    await db.delete(s.notifications).where(eq(s.notifications.recipientId, identityId));
    const convIds = (
      await db
        .select({ id: s.conversations.id })
        .from(s.conversations)
        .where(sql`participant_ids @> ${JSON.stringify([identityId])}::jsonb`)
    ).map((r) => r.id);
    if (convIds.length) {
      await db.delete(s.messages).where(inArray(s.messages.conversationId, convIds));
      await db.delete(s.conversations).where(inArray(s.conversations.id, convIds));
    }
    await db.delete(s.magicLinks).where(eq(s.magicLinks.email, identity.email));
    await db.delete(s.otps).where(eq(s.otps.email, identity.email));
    await db.delete(s.sessions).where(eq(s.sessions.identityId, identityId));
    await db.delete(s.userPreferences).where(eq(s.userPreferences.identityId, identityId));
    await db.delete(s.identities).where(eq(s.identities.id, identityId));
    return;
  }

  throw new Error("unknown_op");
}
