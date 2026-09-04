/**
 * VS7.15 — Admin notification triggers. Founder 2026-08-22: notify staff on EVERYTHING.
 * Each event fans out to staff identities BY CAPABILITY as a `system` notification.
 * No PII in the body.
 *
 * FAN-OUT FIX (2026-09-04, persona cleanup): the Phase-1 synthetic "admin"
 * inbox was a black hole — recipientId "admin" matches no identity, so staff
 * notifications were readable by nobody (7 unread rows stranded in prod).
 * notifyStaff now resolves the REAL staff roster and writes one row per
 * staff member holding the event's capability. The capability matrix stays
 * the single source of truth — role lists are never hardcoded here.
 *
 * Capability mapping (event -> who needs to see it):
 *   new_report / new_appeal / system_alert / high_message_volume /
 *   pending_verification_24h / bulk_action_failed
 *     -> case.review (triage-tier: moderator, admin, super_admin)
 *   account_deletion_request
 *     -> data.erasure (super_admin only)
 */
import { mockNotificationRepo } from "./shopper";
import { mockIdentityRepo } from "./auth";
import { hasCapability, type Capability } from "./staff";
import type { NotificationType } from "./interfaces";

type AdminEvent =
  | "new_report"
  | "new_appeal"
  | "high_message_volume"
  | "pending_verification_24h"
  | "bulk_action_failed"
  | "account_deletion_request"
  | "system_alert";

const EVENT_BODY: Record<AdminEvent, string> = {
  new_report: "A new report needs triage.",
  new_appeal: "A user submitted an account appeal.",
  high_message_volume: "Unusual message volume detected from an account.",
  pending_verification_24h: "A vendor verification has been pending over 24h.",
  bulk_action_failed: "A bulk admin action failed.",
  account_deletion_request: "An account deletion has been requested.",
  system_alert: "System alert: check the admin dashboard.",
};

/** Which capability a staff member needs to be a recipient of this event. */
const EVENT_CAPABILITY: Record<AdminEvent, Capability> = {
  new_report: "case.review",
  new_appeal: "case.review",
  high_message_volume: "case.review",
  pending_verification_24h: "case.review",
  bulk_action_failed: "case.review",
  account_deletion_request: "data.erasure",
  system_alert: "case.review",
};

/**
 * Queue a staff notification, fanned out to every staff identity holding the
 * event's capability. Falls back to NO-ONE (rather than the old synthetic
 * "admin") when the roster is empty — a silent skip is more honest than
 * writing rows no one can read.
 */
export async function notifyStaff(event: AdminEvent, opts?: { refId?: string }): Promise<void> {
  const type: NotificationType = "system";
  const cap = EVENT_CAPABILITY[event];

  // Resolve the real roster. list() is analytics-tier and mock-backed on the
  // real repo (returns all identities); filter to active staff with the cap.
  let recipients: string[] = [];
  try {
    const all = await mockIdentityRepo.list();
    recipients = all
      .filter((i) => i.staffRole && i.accountStatus === "active" && hasCapability(i.staffRole, cap))
      .map((i) => i.id);
  } catch {
    // roster resolution failing must never break the caller's flow (appeal
    // intake, report, triage) — same fire-and-forget contract as before.
    return;
  }

  for (const recipientId of recipients) {
    await mockNotificationRepo.create({
      recipientId,
      type,
      title: `Admin alert: ${event.replace(/_/g, " ")}`,
      body: EVENT_BODY[event],
      refId: opts?.refId ?? null,
    }).catch(() => {}); // one recipient failing must not kill the rest
  }
}
