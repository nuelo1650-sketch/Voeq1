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
 * Vendor analytics data (2026-09-04 redesign, mock GO).
 *
 * REAL DATA ONLY — honest-data rules enforced:
 *   - every number traces to page_events / messages / wishlist / follows
 *   - a zero is a zero; "first week" honesty for trends; no fabricated history
 *   - per-listing views come from listing_view events; per-listing saves from
 *     SavedListingRepo.listByVendor (cross-shopper, re-shipped this round)
 *
 * Response:
 *   week:    { views, messages, saves, followers }            (last 7 days)
 *   prev:    { views, messages, saves, followers }            (7 days before)
 *   daily:   [{ day: 'Mon', views: n }, ...]                  (7 entries, oldest first)
 *   perListing: [{ id, title, views, saves }]                 (vendor's own listings)
 *   sources: [{ path: 'explore'|'direct'|'search', count }]   (page_events.path)
 */
export async function GET() {
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity || !identity.vendorId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const vendorId = identity.vendorId;
  const DAY = 24 * 3600 * 1000;
  const now = Date.now();
  const sinceThis = now - 7 * DAY;
  const sinceLast = now - 14 * DAY;

  const allListings = await mockListingsRepo.list({});
  const selfListings = allListings.filter((l) => l.vendorId === vendorId);
  const listingIds = new Set(selfListings.map((l) => l.id));

  // page events across BOTH windows (single query, filtered in memory)
  const events = await mockPageEventStore.query({ since: sinceLast });
  const isView = (e: { type: string; refId?: string | null }) =>
    (e.type === "storefront_view" && e.refId === vendorId) ||
    (e.type === "listing_view" && e.refId && listingIds.has(e.refId));
  const at = (e: { at: string }) => new Date(e.at).getTime();

  const viewEventsThis = events.filter((e) => isView(e) && at(e) >= sinceThis);
  const viewEventsLast = events.filter((e) => isView(e) && at(e) >= sinceLast && at(e) < sinceThis);
  const views = viewEventsThis.length;
  const prevViews = viewEventsLast.length;

  // daily series (last 7 days, oldest -> today) — real per-day counts
  const DAY_MS = DAY;
  const daily: Array<{ day: string; views: number }> = [];
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const todayStart = startOfToday.getTime();
  for (let i = 6; i >= 0; i--) {
    const dayStart = todayStart - i * DAY_MS;
    const dayEnd = dayStart + DAY_MS;
    const count = viewEventsThis.filter((e) => {
      const t = at(e);
      return t >= Math.max(dayStart, sinceThis) && t < dayEnd;
    }).length;
    daily.push({ day: DAY_NAMES[new Date(dayStart).getDay()], views: count });
  }

  // per-listing views this window
  const perListingViews = new Map<string, number>();
  for (const e of viewEventsThis) {
    if (e.type === "listing_view" && e.refId) perListingViews.set(e.refId, (perListingViews.get(e.refId) ?? 0) + 1);
  }

  // traffic sources from real path data (page_events carry the page URL)
  const sourcesMap = new Map<string, number>();
  for (const e of viewEventsThis) {
    const p = (e as { path?: string | null }).path ?? "";
    let src = "direct";
    if (p.includes("/explore")) src = "explore";
    else if (p.includes("google.") || p.includes("search")) src = "search";
    else if (!p || p === "/" || p.includes("direct")) src = "direct";
    else src = "other";
    sourcesMap.set(src, (sourcesMap.get(src) ?? 0) + 1);
  }
  const sources = [...sourcesMap.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

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
    // vendor-scoped (B2 fix): saves OF my listings + my store, by everyone.
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

  // per-listing payload (title resolved here so the client doesn't need a second fetch)
  const perListing = selfListings.map((l) => ({
    id: l.id,
    title: l.title,
    views: perListingViews.get(l.id) ?? 0,
    saves: perListingSaves.get(l.id) ?? 0,
  }));

  return NextResponse.json({
    ok: true,
    week: { views, messages: messages7d, saves: saves7d, followers: followers7d },
    prev: { views: prevViews, messages: messagesPrev, saves: savesPrev, followers: followersPrev },
    daily,
    perListing,
    sources,
  });
}
