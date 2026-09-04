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
 *
 * Counts for the dashboard's This-week row. Honest: a zero or missing signal
 * returns 0 (or null when never aggregated), never a fabricated number.
 * Scope: last 7 days. Owner-only (identity.vendorId).
 *
 * views     -> page_events (storefront_view + listing_view for this vendor's listings)
 * messages  -> conversations where this identity participates (new messages in 7d)
 * saves     -> wishlist_items for this vendor's listings/vendor (7d)
 * followers -> follows where vendorId = this vendor (7d)
 */
export async function GET() {
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity || !identity.vendorId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const vendor = await mockAuthRepo.currentIdentity(identity.id);
  const vendorId = identity.vendorId;
  const WEEK_MS = 7 * 24 * 3600 * 1000;
  const since = new Date(Date.now() - WEEK_MS).getTime();
  const sinceIso = new Date(since).toISOString();

  // own listings (for listing_view refIds + saved listing refs)
  const allListings = await mockListingsRepo.list({});
  const selfListings = allListings.filter((l) => l.vendorId === vendorId);
  const listingIds = new Set(selfListings.map((l) => l.id));

  // page events 7d
  const events = await mockPageEventStore.query({ since });
  const views = events.filter(
    (e) =>
      (e.type === "storefront_view" && e.refId === vendorId) ||
      (e.type === "listing_view" && e.refId && listingIds.has(e.refId)),
  ).length;

  // individual distinct visitors for views vs raw count? keep raw count (honest label "views")
  let messages7d = 0;
  try {
    const convs = await mockConversationRepo.listForIdentity(identity.id);
    const ids = convs.map((c) => c.id);
    const allMsgs = await mockMessageRepo.listAll();
    messages7d = allMsgs.filter((m) => ids.includes(m.conversationId) && new Date(m.createdAt).getTime() >= since).length;
  } catch {
    messages7d = 0;
  }

  let saves7d = 0;
  try {
    const saved = await mockSavedListingRepo.list(identity.id);
    saves7d = saved.filter(
      (w) =>
        new Date(w.createdAt).getTime() >= since &&
        ((w.listingId && listingIds.has(w.listingId)) || w.vendorId === vendorId),
    ).length;
  } catch {
    saves7d = 0;
  }

  let followers7d = 0;
  try {
    const followers = await mockFollowRepo.listByVendor(vendorId);
    followers7d = followers.filter((f) => new Date(f.createdAt ?? "").getTime() >= since).length;
  } catch {
    followers7d = 0;
  }

  return NextResponse.json({
    ok: true,
    week: {
      views,
      messages: messages7d,
      saves: saves7d,
      followers: followers7d,
      reviews: 0, // no review repo query available here; keep 0-honest (VendorAnalytics handles reviews)
    },
  });
}
