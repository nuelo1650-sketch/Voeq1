import { NextResponse } from "next/server";
import { devSignInAs, mockIdentityRepo } from "@voeq/data";

/**
 * DEV/TEST ONLY — establishes a shopper session so the VS5/VS6 E2E harness can
 * exercise shopper actions (reviews, follows, messages). Not referenced by any
 * production path. Guard: only mounts in non-production.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "unavailable" }, { status: 404 });
  }
  const { sessionId, identity } = await devSignInAs("shopper");
  // P-A round 74 (harness hygiene): earlier E2E scripts mutated the SHARED
  // dev-shopper identity's vendorId (mockIdentityRepo.patch), so 'shopper'
  // audit runs reported vendor analytics 200 — a false IDOR finding. Reset
  // vendorId to null so every shopper test starts as a pure shopper. Same
  // reason the vendor-session route links a vendor identity explicitly.
  await mockIdentityRepo.patch(identity.id, { vendorId: null } as never);
  const res = NextResponse.json({ ok: true, sessionId, identityId: identity.id });
  res.cookies.set("sessionId", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  return res;
}
