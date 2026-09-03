import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logAudit } from "@voeq/data";
import { adminCleanup } from "@voeq/db";
import { SESSION_COOKIE } from "@/lib/session";
import { mockAuthRepo } from "@voeq/data";

/**
 * DELETE /api/settings/delete-account — P-A round 79.
 *
 * The Settings "Delete account" button has been wired to this endpoint since it
 * shipped, but the route never existed (404). Build it:
 *  - self-service, session-auth required (401 without a session)
 *  - staff identities are refused (a super_admin/admin must NOT be able to
 *    delete their own account via the self-service flow — that would lock the
 *    account owner out of the admin plane; mirror the account-action guard)
 *  - full erasure via the SAME tested cascade staff admin-cleanup uses
 *    (adminCleanup("delete-identity")) — child-first, no orphan rows, removes
 *    the vendor + listings + conversations + sessions + every personal record
 *  - audited so the delete is traceable
 *  - session cookie cleared so the client can't keep acting as a dead account
 */
export async function DELETE() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = sessionId ? await mockAuthRepo.currentIdentity(sessionId) : null;
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Guard: no self-delete for staff. account-action already protects the
  // super_admin from self-harm; replicate at the erasure boundary.
  if (identity.staffRole) {
    return NextResponse.json(
      { error: "Staff accounts cannot delete themselves via Settings. Use the admin operation which records the actor." },
      { status: 403 },
    );
  }

  try {
    await adminCleanup("delete-identity", { identityId: identity.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `delete_failed: ${msg}` }, { status: 500 });
  }

  await logAudit("identity.delete.self", identity.id, { identityId: identity.id });

  const res = NextResponse.json({ ok: true, redirect: "/login" });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
