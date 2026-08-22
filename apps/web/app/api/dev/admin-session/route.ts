import { NextResponse } from "next/server";
import { mockIdentityRepo, mockSessionRepo, bootstrapSuperAdmin } from "@voeq/data";

/**
 * DEV/TEST ONLY — establishes a super_admin session for the bootstrapped admin
 * (VOEQ_SUPER_ADMIN_EMAIL) so the VS7 E2E harness can exercise staff routes.
 * Not referenced by any production path. Guard: only mounts in non-production.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "unavailable" }, { status: 404 });
  }
  await bootstrapSuperAdmin(); // idempotent
  const envEmail = process.env.VOEQ_SUPER_ADMIN_EMAIL;
  if (!envEmail) return NextResponse.json({ error: "no_super_admin_email" }, { status: 400 });
  const identity = await mockIdentityRepo.getByEmail(envEmail.trim().toLowerCase());
  if (!identity) return NextResponse.json({ error: "super_admin_not_found" }, { status: 404 });

  const session = await mockSessionRepo.create(identity.id);
  const res = NextResponse.json({ ok: true, sessionId: session.id, identityId: identity.id, staffRole: identity.staffRole });
  res.cookies.set("sessionId", session.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  return res;
}
