import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { bootstrapSuperAdmin, mockAuthRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS7.2 — One-time super_admin bootstrap. Reads VOEQ_SUPER_ADMIN_EMAIL.
 * Idempotent: if a super_admin already exists for that email, returns it.
 *
 * P-A round 21 (SECURITY FIX): previously this route had NO auth — anyone could
 * POST and promote a super-admin (bootstrapSuperAdmin uses the env email, but
 * the route itself was open). Now: caller must be an authenticated identity
 * with staffRole already set (moderator/admin/super_admin). That prevents the
 * unauthenticated promotion attack without breaking the legit bootstrap flow
 * (a staff member can bootstrap their own env-email account once).
 */
export async function POST() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  if (!sessionId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  // Staff-only: the caller must already hold a staff capability.
  if (!identity.staffRole) {
    return NextResponse.json({ error: "Bootstrap is staff-only." }, { status: 403 });
  }

  const result = await bootstrapSuperAdmin();
  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? "bootstrap_failed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, identityId: result.identityId }, { status: 200 });
}
