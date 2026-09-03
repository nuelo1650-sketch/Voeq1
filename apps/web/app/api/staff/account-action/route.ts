import { NextRequest, NextResponse } from "next/server";
import {
  mockIdentityRepo,
  canAccountAction,
  logAudit,
  notifyEnforcement,
  recordAuthEvent,
  clientIpFrom,
} from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * Staff batch 1 — account enforcement ladder. Server-authoritative.
 *
 *   warn       → status unchanged, warningCount++, user notified
 *   suspend    → temporary; requires a FUTURE expiresAt; sessions revoked;
 *                auto-reinstates at expiry (sweep); user notified
 *   ban        → permanent until manual reinstate; sessions revoked; notified
 *   reinstate  → back to active; clears expiry (warning history kept)
 *
 * Every action: reason >= 20 chars, audited, forensic auth event recorded,
 * and the target user receives a notification with the reason + appeal email.
 * No self-harm, super_admin protected (canAccountAction).
 */
const ACTIONS = new Set(["warn", "suspend", "ban", "reinstate"]);
type LadderAction = "warn" | "suspend" | "ban" | "reinstate";

export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireCapability("account.suspend");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }

  let body: { targetIdentityId?: string; action?: string; reason?: string; expiresAt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const targetId = typeof body.targetIdentityId === "string" ? body.targetIdentityId.trim() : "";
  const action = typeof body.action === "string" ? body.action : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!targetId || !ACTIONS.has(action)) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  if (reason.length < 20) return NextResponse.json({ error: "reason_min_20" }, { status: 400 });

  // Suspension must have a real end date — "suspend forever" is a ban, use ban.
  let expiresAt: string | null = null;
  if (action === "suspend") {
    const raw = typeof body.expiresAt === "string" ? body.expiresAt : "";
    const t = Date.parse(raw);
    if (!raw || Number.isNaN(t)) return NextResponse.json({ error: "expiresAt_required" }, { status: 400 });
    if (t <= Date.now()) return NextResponse.json({ error: "expiresAt_future_required" }, { status: 400 });
    expiresAt = new Date(t).toISOString();
  }

  const target = await mockIdentityRepo.getById(targetId);
  if (!target) return NextResponse.json({ error: "target_not_found" }, { status: 404 });

  const check = canAccountAction(actor.staffRole, actor.id, target.id, target.staffRole, action as LadderAction);
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 403 });

  let warningCount = target.warningCount ?? 0;
  if (action === "warn") {
    warningCount += 1;
    await mockIdentityRepo.patch(target.id, { warningCount });
  } else if (action === "suspend") {
    await mockIdentityRepo.setStatus(target.id, "suspended"); // revokes sessions (both paths)
    await mockIdentityRepo.patch(target.id, { suspensionExpiresAt: expiresAt });
  } else if (action === "ban") {
    await mockIdentityRepo.setStatus(target.id, "banned"); // revokes sessions
    await mockIdentityRepo.patch(target.id, { suspensionExpiresAt: null });
  } else {
    // reinstate — clear expiry, KEEP warningCount (history matters)
    await mockIdentityRepo.setStatus(target.id, "active");
    await mockIdentityRepo.patch(target.id, { suspensionExpiresAt: null });
  }

  await logAudit("account.action", actor.id, { targetId, action, reason, expiresAt, warningCount, adminAction: true });
  await recordAuthEvent({
    identityId: target.id,
    event: "account_action",
    email: target.email,
    ip: clientIpFrom(req.headers.get("x-forwarded-for")),
    userAgent: req.headers.get("user-agent"),
  });
  await notifyEnforcement({
    recipientId: target.id,
    action: action as LadderAction,
    reason,
    expiresAt,
    warningCount,
  });

  const status = action === "warn" ? target.accountStatus : action === "suspend" ? "suspended" : action === "ban" ? "banned" : "active";
  return NextResponse.json({ ok: true, accountStatus: status, warningCount }, { status: 200 });
}
