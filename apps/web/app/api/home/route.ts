import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  mockAuthRepo,
  mockSavedListingRepo,
  mockFollowRepo,
  mockReviewRepo,
  mockNotificationRepo,
  mockConversationRepo,
  mockMessageRepo,
  mockVendorRepo,
  loadExplore,
  campuses,
} from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * GET /api/home — aggregated shopper dashboard (VS4.7).
 * Auth required. Returns saved, following, recommended (campus trending),
 * review count, notification preview + unread count. No fake data.
 */
export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const saved = await mockSavedListingRepo.list(identity.id);
  const following = await mockFollowRepo.list(identity.id);
  const myReviews = (await Promise.all(following.map((f) => mockReviewRepo.listByVendor(f.vendorId))))
    .flat()
    .filter((r) => r.authorId === identity.id);
  const notifications = await mockNotificationRepo.list(identity.id);
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  // Real message-thread unread count (mirrors messages page B6: unread = messages
  // from other senders not yet marked read).
  const conversations = await mockConversationRepo.listForIdentity(identity.id);
  let unreadMessages = 0;
  for (const c of conversations) {
    const msgs = await mockMessageRepo.listByConversation(c.id, null, 200);
    unreadMessages += msgs.filter((m) => m.senderId !== identity.id && m.state !== "read").length;
  }

  // Enrich followed vendors with their display name (no raw IDs in the UI).
  const followingVendors = await Promise.all(
    following.map(async (f) => {
      const v = await mockVendorRepo.getById(f.vendorId);
      return { vendorId: f.vendorId, vendorName: v?.name ?? f.vendorId };
    })
  );

  // Recommended: campus-wide trending. P-A round 72 (FIX empty shopper home):
  // the old fallback was campus: identity.campus ?? campuses[0]?.id ?? "NMU" —
  // "NMU" is NOT a real slug (real: "nmu-okerenkoko"), so a shopper who hadn't
  // picked a campus got loadExplore("NMU") -> EMPTY -> recommended: [] -> the
  // whole dashboard rendered as empty boxes while Explore had real listings.
  // Honest rule: filter by campus ONLY when the identity has one; otherwise
  // show the full public feed (the shopper hasn't CHOOSEN a campus yet —
  // hiding every listing until they do is not product, it's a bug).
  const explore = await loadExplore({
    query: "",
    campus: identity.campus ?? undefined,
  });

  return NextResponse.json({
    savedListings: saved.filter((s) => s.listingId).map((s) => s.listingId),
    savedVendors: saved.filter((s) => s.vendorId).map((s) => s.vendorId),
    following: following.map((f) => f.vendorId),
    followingVendors,
    reviewCount: myReviews.length,
    notifications: notifications.slice(0, 5),
    unreadNotifications,
    unreadMessages,
    // P-A round 73: `??` only falls back on null/undefined — trending being an
    // EMPTY array (no featured listings) left recommended=[] forever even when
    // explore.data had real listings. Fall back on length, not null.
    recommended: explore.trending.length > 0 ? explore.trending : explore.data,
  });
}
