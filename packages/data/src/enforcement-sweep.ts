/**
 * Staff batch 1 — suspension auto-expiry.
 *
 * A temporary suspension must actually END. No cron infra at this scale: the
 * sweep runs lazily whenever the staff Users panel loads (GET /api/staff/users)
 * and at login time (auth path checks status anyway). Both call sites are
 * idempotent — a row only flips once.
 *
 * On auto-reinstate: status -> active, expiry cleared, user notified, audit
 * entry `account.auto_reinstate` (system actor).
 */
import { mockIdentityRepo } from "./auth";
import { logAudit } from "./audit";
import { notifyEnforcement } from "./user-notifications";

export interface SweepReport {
  reinstated: number;
  ids: string[];
}

/** Flip every suspension whose expiry has passed. Returns what changed. */
export async function reinstateExpiredSuspensions(now: number = Date.now()): Promise<SweepReport> {
  const all = await mockIdentityRepo.list();
  const expired = all.filter(
    (i) =>
      i.accountStatus === "suspended" &&
      i.suspensionExpiresAt &&
      Date.parse(i.suspensionExpiresAt) <= now,
  );
  for (const ident of expired) {
    await mockIdentityRepo.setStatus(ident.id, "active");
    await mockIdentityRepo.patch(ident.id, { suspensionExpiresAt: null });
    await logAudit("account.auto_reinstate", ident.id, {
      expiredAt: ident.suspensionExpiresAt,
      adminAction: true,
    });
    await notifyEnforcement({
      recipientId: ident.id,
      action: "auto_reinstate",
    });
  }
  return { reinstated: expired.length, ids: expired.map((i) => i.id) };
}

/**
 * Login-path helper: if this identity is a suspension that has expired, lift
 * it and return true (caller then allows the login attempt to proceed with
 * fresh status). Cheap: only touches suspended rows with an expiry set.
 */
export async function liftExpiredSuspension(identityId: string, now: number = Date.now()): Promise<boolean> {
  const ident = await mockIdentityRepo.getById(identityId);
  if (!ident || ident.accountStatus !== "suspended" || !ident.suspensionExpiresAt) return false;
  if (Date.parse(ident.suspensionExpiresAt) > now) return false;
  await mockIdentityRepo.setStatus(ident.id, "active");
  await mockIdentityRepo.patch(ident.id, { suspensionExpiresAt: null });
  await logAudit("account.auto_reinstate", ident.id, {
    expiredAt: ident.suspensionExpiresAt,
    adminAction: true,
  });
  await notifyEnforcement({ recipientId: ident.id, action: "auto_reinstate" });
  return true;
}
