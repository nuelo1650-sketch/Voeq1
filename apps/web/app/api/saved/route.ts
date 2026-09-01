import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockSavedListingRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * GET /api/saved?targetType=listing|vendor&targetId=... — P-A round 11 (S1):
 * current saved state so SaveButton initializes correctly (was always false →
 * first click reversed a real save).
 * POST /api/saved — toggle a saved listing or vendor (Doc 08 §8.7).
 * Auth required. Actor identity comes from the session — never the request body.
 */
export async function GET(req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const targetType = url.searchParams.get("targetType");
  const targetId = url.searchParams.get("targetId");
  if (targetType !== "listing" && targetType !== "vendor") {
    return NextResponse.json({ error: "invalid targetType" }, { status: 400 });
  }
  if (!targetId) return NextResponse.json({ error: "invalid targetId" }, { status: 400 });

  const items = await mockSavedListingRepo.list(identity.id);
  // WishlistItem carries listingId OR vendorId (not targetId) — check both.
  const saved = items.some((w) =>
    (targetType === "listing" ? w.listingId === targetId : false) ||
    (targetType === "vendor" ? w.vendorId === targetId : false)
  );
  return NextResponse.json({ ok: true, saved, targetType, targetId });
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

  const result = await mockSavedListingRepo.toggle({ shopperId: identity.id, targetType, targetId });

  return NextResponse.json({ ok: true, saved: result.saved });
}
