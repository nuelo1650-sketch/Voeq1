import { NextResponse } from "next/server";
import { devSignInAs, mockIdentityRepo, mockVendorRepo } from "@voeq/data";

/**
 * DEV/TEST ONLY — establishes a vendor session linked to a seeded vendor (default v1)
 * so the VS5 E2E harness can exercise owner-only routes without the full onboarding
 * flow. Not referenced by any production path. Guard: only mounts in non-production.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "unavailable" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const vendorId = typeof body.vendorId === "string" ? body.vendorId : "v1";
  const suspend = body.suspend === true;

  const { sessionId, identity } = await devSignInAs("vendor");
  await mockIdentityRepo.patch(identity.id, { vendorId } as never);
  const vendor = await mockVendorRepo.getById(vendorId);
  if (vendor && !vendor.identityId) {
    await mockVendorRepo.patch(vendorId, { identityId: identity.id } as never);
  }
  if (suspend && vendor) {
    await mockVendorRepo.patch(vendorId, { status: "suspended" } as never);
  }

  const res = NextResponse.json({ ok: true, sessionId, vendorId });
  res.cookies.set("sessionId", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  return res;
}
