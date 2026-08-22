import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockFollowRepo, mockVendorRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * POST /api/follow — toggle follow on a vendor (Doc 08 §8.7).
 * Auth required. Self-follow not allowed. Actor = session identity.
 */
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const vendorId = body?.vendorId;
  if (typeof vendorId !== "string" || !vendorId) {
    return NextResponse.json({ error: "invalid vendorId" }, { status: 400 });
  }

  // IDOR/self-follow guard: a shopper cannot follow their own vendor account.
  const vendor = await mockVendorRepo.getById(vendorId);
  if (!vendor) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (vendor.identityId && vendor.identityId === identity.id) {
    return NextResponse.json({ error: "cannot_follow_self" }, { status: 400 });
  }

  const result = await mockFollowRepo.toggle({ followerId: identity.id, vendorId });
  return NextResponse.json({ ok: true, following: result.following });
}
