import { NextRequest, NextResponse } from "next/server";
import { mockIdentityRepo, canAccountAction, logAudit } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * VS7.7 — Account actions (suspend/ban/reinstate). Server-authoritative.
 * Reason >= 20 chars. No self-harm, super_admin protected. setStatus revokes
 * sessions automatically (auth.ts). Audited.
 */
export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireCapability("account.suspend");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }

  let body: { targetIdentityId?: string; action?: "suspend" | "ban" | "reinstate"; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const targetId = typeof body.targetIdentityId === "string" ? body.targetIdentityId.trim() : "";
  const action = body.action;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!targetId || !action) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  if (reason.length < 20) return NextResponse.json({ error: "reason_min_20" }, { status: 400 });

  const target = await mockIdentityRepo.getById(targetId);
  if (!target) return NextResponse.json({ error: "target_not_found" }, { status: 404 });

  const check = canAccountAction(actor.staffRole, actor.id, target.id, target.staffRole, action);
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 403 });

  const status = action === "suspend" ? "suspended" : action === "ban" ? "banned" : "active";
  await mockIdentityRepo.setStatus(target.id, status);
  await logAudit("account.action", actor.id, { targetId, action, reason, adminAction: true });
  return NextResponse.json({ ok: true, accountStatus: status }, { status: 200 });
}
