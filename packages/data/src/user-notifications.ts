/**
 * Staff batch 1 — user-facing enforcement notifications.
 *
 * When staff act on an account (warn/suspend/ban/reinstate) or moderate their
 * content, the affected user MUST be told: what happened, why (the staff-
 * written reason), and how to appeal (email support@voeq.ng). A silent ban is
 * a trust disaster; David's lock (2026-09-03): "notification with reason +
 * appeal-by-reply".
 *
 * The reason text is staff-authored and shown verbatim — it is NOT PII of any
 * third party, so echoing it into the target's own notification is safe.
 */
import { mockNotificationRepo } from "./shopper";
import type { NotificationType } from "./interfaces";

export const APPEAL_LINE = "If you believe this is a mistake, email support@voeq.ng to appeal.";

export type EnforcementAction = "warn" | "suspend" | "ban" | "reinstate" | "auto_reinstate";

const TITLE: Record<EnforcementAction, string> = {
  warn: "Warning on your account",
  suspend: "Your account is suspended",
  ban: "Your account is banned",
  reinstate: "Your account is active again",
  auto_reinstate: "Your suspension has ended",
};

export async function notifyEnforcement(opts: {
  recipientId: string;
  action: EnforcementAction;
  reason?: string;
  expiresAt?: string | null;
  warningCount?: number;
}): Promise<void> {
  const parts: string[] = [];
  if (opts.action === "warn" && opts.warningCount !== undefined) {
    parts.push(`This is warning #${opts.warningCount} on your account.`);
  }
  if (opts.reason) parts.push(`Reason: ${opts.reason}`);
  if (opts.action === "suspend" && opts.expiresAt) {
    const when = new Date(opts.expiresAt).toUTCString();
    parts.push(`Your account will be automatically reactivated after ${when}.`);
  }
  if (opts.action === "auto_reinstate") {
    parts.push("Your suspension period has ended and you can use Voeq normally again.");
  }
  if (opts.action === "reinstate") {
    parts.push("A staff member has reactivated your account. You can use Voeq normally again.");
  }
  parts.push(APPEAL_LINE);
  const type: NotificationType = "account_action";
  await mockNotificationRepo.create({
    recipientId: opts.recipientId,
    type,
    title: TITLE[opts.action],
    body: parts.join(" "),
    refId: null,
  });
}

/** Content-moderation notice (listing removed etc.) — same appeal contract. */
export async function notifyContentAction(opts: {
  recipientId: string;
  title: string;
  reason?: string;
  refId?: string | null;
}): Promise<void> {
  const parts: string[] = [];
  if (opts.reason) parts.push(`Reason: ${opts.reason}`);
  parts.push(APPEAL_LINE);
  await mockNotificationRepo.create({
    recipientId: opts.recipientId,
    type: "account_action",
    title: opts.title,
    body: parts.join(" "),
    refId: opts.refId ?? null,
  });
}
