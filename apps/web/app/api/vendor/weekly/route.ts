import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  mockAuthRepo,
  mockPageEventStore,
  mockSavedListingRepo,
  mockFollowRepo,
  mockMessageRepo,
  mockConversationRepo,
  mockListingsRepo,
} from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * P-A round 66 — Vendor "This week" metrics (REAL DATA).
 * Vendor redesign (2026-09-04): extended with per-listing metrics + a
 * last-week comparison so the dashboard can show honest trends and
 * a "Top" performer marker. Zero/missing signals return 0 — never fabricated.
 *
 * Scope: this week = last 7 days; last week = the 7 days before that.
 *
 * views     -> page_events (storefront_view + listing_view for this vendor)
 * messages  -> new messages in the vendor's conversations
 * saves     -> wishlist_items for this vendor's listings/vendor
 * followers -> follows where vendorId = this vendor
 * listings  -> per-listing {views, saves} this week (drives card metrics)
 */
export async function GET() {
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity || !identity.vendorId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const vendorId = identity.vendorId;
  const DAY = 24 * 3600 * 1000;
  const WEEK = 7 * DAY;
  const now = Date.now();
  const sinceThis = new Date(now - WEEK).getTime();
  const sinceLast = new Date(now - 2 * WEEK).getTime();

  // own listings
  const allListings = await mockListingsRepo.list({});
  const selfListings = allListings.filter((l) => l.vendorId === vendorId);
  const listingIds = new Set(selfListings.map((l) => l.id));

  // page events covering BOTH windows
  const events = await mockPageEventStore.query({ since: sinceLast });
  const isView = (e: { type: string; refId?: string | null }) =>
    (e.type === "storefront_view" && e.refId === vendorId) ||
    (e.type === "listing_view" && e.refId && listingIds.has(e.refId));
  const at = (e: { at: string }) => new Date(e.at).getTime();

  const thisWeekEvents = events.filter((e) => isView(e) && at(e) >= sinceThis);
  const lastWeekEvents = events.filter((e) => isView(e) && at(e) >= sinceLast && at(e) < sinceThis);
  const views = thisWeekEvents.length;
  const prevViews = lastWeekEvents.length;

  // per-listing views this week (listing_view only)
  const perListingViews = new Map<string, number>();
  for (const e of thisWeekEvents) {
    if (e.type === "listing_view" && e.refId) {
      perListingViews.set(e.refId, (perListingViews.get(e.refId) ?? 0) + 1);
    }
  }

  let messages7d = 0;
  let messagesPrev = 0;
  try {
    const convs = await mockConversationRepo.listForIdentity(identity.id);
    const ids = convs.map((c) => c.id);
    const allMsgs = await mockMessageRepo.listAll();
    const mine = allMsgs.filter((m) => ids.includes(m.conversationId));
    messages7d = mine.filter((m) => new Date(m.createdAt).getTime() >= sinceThis).length;
    messagesPrev = mine.filter((m) => {
      const t = new Date(m.createdAt).getTime();
      return t >= sinceLast && t < sinceThis;
    }).length;
  } catch {
    // honest 0
  }

  let saves7d = 0;
  let savesPrev = 0;
  const perListingSaves = new Map<string, number>();
  try {
    // Cross-shopper: saves OF this vendor's listings/vendor by everyone
    // (listByVendor — added with the vendor redesign; the viewer-scoped
    // list() cannot answer "how many people saved my stuff").
    const saved = await mockSavedListingRepo.listByVendor(vendorId);
    for (const w of saved) {
      const t = new Date(w.createdAt).getTime();
      if (t >= sinceThis) {
        saves7d++;
        if (w.listingId) perListingSaves.set(w.listingId, (perListingSaves.get(w.listingId) ?? 0) + 1);
      } else if (t >= sinceLast) {
        savesPrev++;
      }
    }
  } catch {
    // honest 0
  }

  let followers7d = 0;
  let followersPrev = 0;
  try {
    const followers = await mockFollowRepo.listByVendor(vendorId);
    followers7d = followers.filter((f) => new Date(f.createdAt ?? "").getTime() >= sinceThis).length;
    followersPrev = followers.filter((f) => {
      const t = new Date(f.createdAt ?? "").getTime();
      return t >= sinceLast && t < sinceThis;
    }).length;
  } catch {
    // honest 0
  }

  return NextResponse.json({
    ok: true,
    week: {
      views,
      messages: messages7d,
      saves: saves7d,
      followers: followers7d,
      reviews: 0, // no review repo query here; VendorAnalytics handles reviews
    },
    prev: { views: prevViews, messages: messagesPrev, saves: savesPrev, followers: followersPrev },
    perListing: selfListings.map((l) => ({
      id: l.id,
      views: perListingViews.get(l.id) ?? 0,
      saves: perListingSaves.get(l.id) ?? 0,
    })),
  });
}
