/**
 * VS7.15 — Admin notification triggers. Founder 2026-08-22: notify staff on EVERYTHING.
 * Each event fans out to the appropriate staff role(s) as a `system` notification.
 * No PII in the body. In Phase 1 the recipient pool is synthetic ("admin") since the
 * real admin roster is env-bootstrapped; the mechanism (queue + type + body) is real.
 */
import { mockNotificationRepo } from "./shopper";
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

/**
 * Queue a staff notification. `recipientId` defaults to "admin" (the synthetic staff
 * inbox) in Phase 1; Phase 9 routes this to the real staff roster.
 */
export async function notifyStaff(event: AdminEvent, opts?: { refId?: string; recipientId?: string }): Promise<void> {
  const type: NotificationType = "system";
  await mockNotificationRepo.create({
    recipientId: opts?.recipientId ?? "admin",
    type,
    title: `Admin alert: ${event.replace(/_/g, " ")}`,
    body: EVENT_BODY[event],
    refId: opts?.refId ?? null,
  });
}
