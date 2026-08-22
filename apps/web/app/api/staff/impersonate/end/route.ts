import { NextResponse } from "next/server";
import { getCurrentIdentity, SESSION_COOKIE } from "@/lib/session";
import { logAudit } from "@voeq/data";

/**
 * VS7.14 — Impersonation END. Clears the active session cookie and logs the end.
 * (The super_admin's own session is restored by re-logging in; in Phase 1 the admin
 * simply re-authenticates. Audited.)
 */
export async function POST() {
  const actor = await getCurrentIdentity();
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.delete(SESSION_COOKIE);
  if (actor) {
    await logAudit("staff.impersonate.end", actor.id, { adminAction: true });
  }
  return res;
}
