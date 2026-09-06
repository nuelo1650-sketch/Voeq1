import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockLikeRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * GET /api/like?targetType=listing|vendor&targetId=... — P-A round 11 (S1).
 * Returns the CURRENT like state so the client can initialize its button
 * (like/follow/save used to start "false" → first click reversed a real like).
 * Anonymous returns { liked:false } (no state → no 401 noise; POST still gates).
 * POST /api/like — toggle a like on a listing or vendor (VS6 — engagement).
 * Auth required. Actor = session identity. Self-likes ALLOWED (founder
 * decision, L4a 2026-09-06: "a vendor can like their own page and heart too").
 */
export async function GET(req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return NextResponse.json({ ok: true, liked: false, anonymous: true }, { status: 200 });
  }
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) {
    return NextResponse.json({ ok: true, liked: false, anonymous: true }, { status: 200 });
  }

  const url = new URL(req.url);
  const targetType = url.searchParams.get("targetType");
  const targetId = url.searchParams.get("targetId");
  if (targetType !== "listing" && targetType !== "vendor") {
    return NextResponse.json({ error: "invalid targetType" }, { status: 400 });
  }
  if (!targetId) return NextResponse.json({ error: "invalid targetId" }, { status: 400 });

  const likes = await mockLikeRepo.list(identity.id);
  const liked = likes.some((l) => l.targetId === targetId && l.targetType === targetType);
  return NextResponse.json({ ok: true, liked, targetType, targetId });
}

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

  // L4a (2026-09-06, founder decision): the self-like guard is REMOVED —
  // vendors can like their own listing/storefront ("a vendor can like their
  // own page and heart too"). The old guard 400'd with cannot_like_self on
  // both target types.
  const result = await mockLikeRepo.toggle({ actorId: identity.id, targetId, targetType });
  return NextResponse.json({ ok: true, liked: result.liked });
}
