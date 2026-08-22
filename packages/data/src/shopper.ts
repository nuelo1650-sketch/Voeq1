/**
 * VS4 — Shopper relationship repos (mock impl).
 *
 * In-memory Maps, mirroring mock.ts. These are the relationship seams the shopper
 * experience depends on: saved items, follows, likes, reviews, comments, reports,
 * notifications. The LOCKED `interfaces.ts` shapes are unchanged; this file
 * implements the net-new repo interfaces appended in VS4.1.
 *
 * IDOR note: every mutation takes the actor identity as an explicit server-side
 * argument. Callers MUST pass the session-resolved identityId — never trust a
 * client-supplied shopperId/followerId (Doc 09 §9.x).
 */

import type {
  WishlistItem,
  Follow,
  Like,
  Comment,
  Report,
  ReportCategory,
  Notification,
  NotificationType,
  SavedListingRepo,
  FollowRepo,
  LikeRepo,
  ReviewRepo,
  CommentRepo,
  ReportRepo as IReportRepo,
  NotificationRepo as INotificationRepo,
} from "./interfaces";
import { mockStaffRepo, mockListingsRepo } from "./mock";

const nowIso = () => new Date().toISOString();
const id = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ---- Stores -----------------------------------------------------------------
const savedItems = new Map<string, WishlistItem>();
const follows = new Map<string, Follow>();
const likes = new Map<string, Like>();
const reviews = new Map<string, import("./interfaces").Review>();
const comments = new Map<string, Comment>();
const reports = new Map<string, Report>();
const notifications = new Map<string, Notification>();

// ---- SavedListingRepo -------------------------------------------------------
export const mockSavedListingRepo: SavedListingRepo = {
  async toggle({ shopperId, targetType, targetId }) {
    const existing = [...savedItems.values()].find(
      (s) =>
        s.shopperId === shopperId &&
        (targetType === "listing" ? s.listingId === targetId : s.vendorId === targetId),
    );
    if (existing) {
      savedItems.delete(existing.id);
      return { saved: false };
    }
    const item: WishlistItem = {
      id: id("w"),
      shopperId,
      listingId: targetType === "listing" ? targetId : null,
      vendorId: targetType === "vendor" ? targetId : null,
      createdAt: nowIso(),
    };
    savedItems.set(item.id, item);
    return { saved: true, item };
  },
  async list(shopperId) {
    return [...savedItems.values()].filter((s) => s.shopperId === shopperId);
  },
};

/** VS5.11: count saves attributable to a vendor (direct vendor saves + saves of their listings). */
export async function countSavesByVendor(vendorId: string): Promise<number> {
  const vendorListingIds = new Set(
    (await mockListingsRepo.list()).filter((l) => l.vendorId === vendorId).map((l) => l.id),
  );
  return [...savedItems.values()].filter(
    (s) => s.vendorId === vendorId || (s.listingId != null && vendorListingIds.has(s.listingId)),
  ).length;
}

// ---- FollowRepo --------------------------------------------------------------
export const mockFollowRepo: FollowRepo = {
  async toggle({ followerId, vendorId }) {
    const existing = [...follows.values()].find(
      (f) => f.followerId === followerId && f.vendorId === vendorId,
    );
    if (existing) {
      follows.delete(existing.id);
      return { following: false };
    }
    const follow: Follow = { id: id("f"), followerId, vendorId, createdAt: nowIso() };
    follows.set(follow.id, follow);
    return { following: true, follow };
  },
  async list(followerId) {
    return [...follows.values()].filter((f) => f.followerId === followerId);
  },
  async listByVendor(vendorId) {
    return [...follows.values()].filter((f) => f.vendorId === vendorId);
  },
};

// ---- LikeRepo ----------------------------------------------------------------
export const mockLikeRepo: LikeRepo = {
  async toggle({ actorId, targetId, targetType }) {
    const existing = [...likes.values()].find(
      (l) => l.actorId === actorId && l.targetId === targetId && l.targetType === targetType,
    );
    if (existing) {
      likes.delete(existing.id);
      return { liked: false };
    }
    const like: Like = { id: id("lk"), actorId, targetId, targetType, createdAt: nowIso() };
    likes.set(like.id, like);
    return { liked: true, like };
  },
  async list(actorId) {
    return [...likes.values()].filter((l) => l.actorId === actorId);
  },
};

// ---- ReviewRepo (upsert 1 per shopper-vendor) -------------------------------
export const mockReviewRepo: ReviewRepo = {
  async create({ shopperId, vendorId, rating, body }) {
    const existing = [...reviews.values()].find(
      (r) => r.authorId === shopperId && r.vendorId === vendorId,
    );
    if (existing) {
      existing.rating = rating;
      existing.body = body;
      return existing;
    }
    const review: import("./interfaces").Review = {
      id: id("rv"),
      vendorId,
      authorId: shopperId,
      rating,
      body,
      createdAt: nowIso(),
    };
    reviews.set(review.id, review);
    return review;
  },
  async listByVendor(vendorId) {
    return [...reviews.values()].filter((r) => r.vendorId === vendorId);
  },
  async getById(rid) {
    return reviews.get(rid) ?? null;
  },
  async respond(reviewId: string, vendorId: string, body: string) {
    const r = reviews.get(reviewId);
    if (!r) return null;
    if (r.vendorId !== vendorId) return null; // ownership: only the reviewed vendor responds
    if (r.response) return r; // one response per review (no create-twice)
    const now = nowIso();
    // 24h edit window = later of review.createdAt OR response.createdAt (founder 2026-08-22, Doc 09 §9.8).
    // (If a response already existed we'd have returned at line 155; here response is null.)
    const anchor = r.createdAt;
    if (Date.now() - new Date(anchor).getTime() > 24 * 60 * 60 * 1000) {
      return r; // window closed — caller treats as locked (returns unchanged)
    }
    r.response = { body, createdAt: now, editedAt: null };
    return r;
  },
};

// ---- CommentRepo -------------------------------------------------------------
export const mockCommentRepo: CommentRepo = {
  async create({ listingId, authorId, body }) {
    const comment: Comment = {
      id: id("c"),
      listingId,
      authorId,
      body,
      createdAt: nowIso(),
      status: "published",
    };
    comments.set(comment.id, comment);
    return comment;
  },
  async listByListing(listingId) {
    return [...comments.values()]
      .filter((c) => c.listingId === listingId && c.status !== "hidden")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // newest first (flat)
  },
  async getById(cid) {
    return comments.get(cid) ?? null;
  },
};

// ---- ReportRepo (creates a staff case) --------------------------------------
export const mockReportRepo: IReportRepo = {
  async create({ reporterId, targetType, targetId, category, body }) {
    const report: Report = {
      id: id("rp"),
      reporterId,
      targetType,
      targetId,
      category: category as ReportCategory,
      body,
      status: "open",
      createdAt: nowIso(),
    };
    reports.set(report.id, report);
    // Mirror into the staff queue so moderation has a case to action.
    await mockStaffRepo.create({
      queue: "reports",
      decision: null,
      consequence: null,
    });
    return report;
  },
  async list() {
    return [...reports.values()];
  },
};

// ---- NotificationRepo --------------------------------------------------------
export const mockNotificationRepo: INotificationRepo = {
  async create({ recipientId, type, title, body, refId }) {
    const n: Notification = {
      id: id("n"),
      recipientId,
      type: type as NotificationType,
      title,
      body,
      refId: refId ?? null,
      read: false,
      createdAt: nowIso(),
    };
    notifications.set(n.id, n);
    return n;
  },
  async list(recipientId) {
    return [...notifications.values()]
      .filter((n) => n.recipientId === recipientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async markRead(nid, recipientId) {
    const n = notifications.get(nid);
    if (!n || n.recipientId !== recipientId) return false; // IDOR guard
    n.read = true;
    return true;
  },
  async markAllRead(recipientId) {
    for (const n of notifications.values()) {
      if (n.recipientId === recipientId) n.read = true;
    }
    return true;
  },
};

// ---- Dev/test reset ----------------------------------------------------------
export function resetShopperState(): void {
  savedItems.clear();
  follows.clear();
  likes.clear();
  reviews.clear();
  comments.clear();
  reports.clear();
  notifications.clear();
}
