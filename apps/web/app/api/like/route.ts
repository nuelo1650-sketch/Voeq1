import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockLikeRepo, mockListingsRepo, mockVendorRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * POST /api/like — toggle a like on a listing or vendor (VS6 — engagement).
 * Auth required. Actor = session identity. Cannot like your own listing/vendor.
 */
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const targetType = body?.targetType;
  const targetId = body?.targetId;
  if (targetType !== "listing" && targetType !== "vendor") {
    return NextResponse.json({ error: "invalid targetType" }, { status: 400 });
  }
  if (typeof targetId !== "string" || !targetId) {
    return NextResponse.json({ error: "invalid targetId" }, { status: 400 });
  }

  // Self-like guard: a vendor cannot like their own listing/vendor.
  if (targetType === "listing") {
    const listing = await mockListingsRepo.getById(targetId);
    if (!listing) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (listing.vendorId) {
      const vendor = await mockVendorRepo.getById(listing.vendorId);
      if (vendor?.identityId && vendor.identityId === identity.id) {
        return NextResponse.json({ error: "cannot_like_self" }, { status: 400 });
      }
    }
  } else {
    const vendor = await mockVendorRepo.getById(targetId);
    if (!vendor) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (vendor.identityId && vendor.identityId === identity.id) {
      return NextResponse.json({ error: "cannot_like_self" }, { status: 400 });
    }
  }

  const result = await mockLikeRepo.toggle({ actorId: identity.id, targetId, targetType });
  return NextResponse.json({ ok: true, liked: result.liked });
}
