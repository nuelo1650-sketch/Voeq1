import { NextResponse } from "next/server";
import { bootstrapSuperAdmin } from "@voeq/data";

/**
 * VS7.2 — One-time super_admin bootstrap. Reads VOEQ_SUPER_ADMIN_EMAIL.
 * Idempotent: if a super_admin already exists for that email, returns it.
 * NOTE: in a real backend this is replaced by an invite/prod-onboarding flow.
 * Here it is env-gated and safe to call repeatedly (never creates duplicates).
 */
export async function POST() {
  const result = await bootstrapSuperAdmin();
  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? "bootstrap_failed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, identityId: result.identityId }, { status: 200 });
}
