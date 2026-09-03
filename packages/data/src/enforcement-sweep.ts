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
import { purgeAuthEventsOlderThan } from "./auth-events";

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

/**
 * Batch 2 / P6b — lazy retention purge on the login path.
 *
 * No cron infra: the 12-month auth_events purge rides logins, throttled to at
 * most once per hour per process (Render free tier = single instance, so the
 * module-level throttle is sufficient). Fire-and-forget from the caller's
 * perspective — a purge failure must never affect a login. When rows are
 * deleted, an `auth_events.purge` audit entry records the count (never the
 * deleted rows' contents — that's the point of the purge).
 */
const PURGE_INTERVAL_MS = 60 * 60 * 1000;
let lastPurgeAt = 0;

export async function maybePurgeAuthEvents(now: number = Date.now()): Promise<number> {
  if (now - lastPurgeAt < PURGE_INTERVAL_MS) return 0;
  lastPurgeAt = now;
  try {
    const purged = await purgeAuthEventsOlderThan(now);
    if (purged > 0) {
      await logAudit("auth_events.purge", "system", { purged, adminAction: true });
    }
    return purged;
  } catch (e) {
    console.error(`[retention] auth_events purge failed: ${e instanceof Error ? e.message : e}`);
    return 0;
  }
}
