import { NextRequest, NextResponse } from "next/server";
import {
  mockStaffRepo,
  mockIdentityRepo,
  mockNotificationRepo,
  logAudit,
  notifyStaff,
  notifyEnforcement,
  canAccountAction,
  recordAuthEvent,
  clientIpFrom,
} from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * VS7.11 — Report triage. requireCapability('case.review').
 * assign -> set assignedTo (status open->triaged); resolve/dismiss -> set resolution + status.
 * Resolution text required (no empty resolutions). Audited.
 *
 * Batch 2 (T8) — appeals queue closes the loop:
 *  - GET ?queue=appeals enriches each case with the subject's CURRENT
 *    accountStatus (payload only froze the status at submission time).
 *  - POST resolve with reinstate:true on an appeals case runs the SAME
 *    server-authoritative ladder path as /api/staff/account-action
 *    (canAccountAction -> setStatus active -> clear expiry -> notify +
 *    auth event + audit). The capability check happens BEFORE the case is
 *    closed, so a 403 leaves the appeal open.
 *  - Any appeals closure WITHOUT reinstate notifies the appellant the
 *    decision with the staff resolution verbatim — no silent denials.
 */
export async function GET(req: NextRequest) {
  try {
    await requireCapability("case.review");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }
  const queue = req.nextUrl.searchParams.get("queue") ?? "";
  const cases = await mockStaffRepo.listCases(queue);
  if (queue === "appeals") {
    // Resolve current subject status once per identity, not once per case.
    const ids = [...new Set(cases.map((c) => (typeof c.payload?.identityId === "string" ? c.payload.identityId : "")).filter(Boolean))] as string[];
    const statusById = new Map<string, string>();
    await Promise.all(
      ids.map(async (id) => {
        const ident = await mockIdentityRepo.getById(id).catch(() => null);
        statusById.set(id, ident ? ident.accountStatus ?? "active" : "deleted");
      }),
    );
    const enriched = cases.map((c) => ({
      ...c,
      subjectAccountStatus: typeof c.payload?.identityId === "string" ? statusById.get(c.payload.identityId) ?? "unknown" : "unknown",
    }));
    return NextResponse.json({ ok: true, cases: enriched }, { status: 200 });
  }
  return NextResponse.json({ ok: true, cases }, { status: 200 });
}

export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireCapability("case.review");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }

  let body: { caseId?: string; action?: "assign" | "resolve" | "dismiss"; assignedTo?: string; resolution?: string; reinstate?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const caseId = typeof body.caseId === "string" ? body.caseId.trim() : "";
  const action = body.action;
  if (!caseId || !action) return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  const existing = await mockStaffRepo.listCases("");
  const theCase = existing.find((c) => c.id === caseId);
  if (!theCase) return NextResponse.json({ error: "case_not_found" }, { status: 404 });

  const reinstate = body.reinstate === true;
  if (reinstate && theCase.queue !== "appeals") {
    return NextResponse.json({ error: "reinstate_only_for_appeals" }, { status: 400 });
  }

  // Appeals reinstate: gate + load target BEFORE closing the case, so a
  // 403/404 leaves the appeal open for a higher-ranked staff member.
  let reinstateTarget: Awaited<ReturnType<typeof mockIdentityRepo.getById>> = null;
  if (reinstate && action === "resolve") {
    const targetId = typeof theCase.payload?.identityId === "string" ? theCase.payload.identityId : "";
    if (!targetId) return NextResponse.json({ error: "case_missing_identity" }, { status: 400 });
    reinstateTarget = await mockIdentityRepo.getById(targetId);
    if (!reinstateTarget) return NextResponse.json({ error: "target_not_found" }, { status: 404 });
    const check = canAccountAction(actor.staffRole, actor.id, reinstateTarget.id, reinstateTarget.staffRole, "reinstate");
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 403 });
  }

  let result = null;
  if (action === "assign") {
    const assignedTo = typeof body.assignedTo === "string" ? body.assignedTo.trim() : actor.id;
    result = await mockStaffRepo.assignCase(caseId, assignedTo);
  } else {
    const resolution = typeof body.resolution === "string" ? body.resolution.trim() : "";
    if (resolution.length < 1) return NextResponse.json({ error: "resolution_required" }, { status: 400 });
    result = await mockStaffRepo.resolveCase(caseId, resolution, action === "resolve" ? "resolved" : "dismissed");

    if (theCase.queue === "appeals") {
      const targetId = typeof theCase.payload?.identityId === "string" ? theCase.payload.identityId : "";
      const target = targetId ? await mockIdentityRepo.getById(targetId).catch(() => null) : null;
      if (target) {
        if (reinstate && action === "resolve" && reinstateTarget) {
          await mockIdentityRepo.setStatus(target.id, "active"); // revokes nothing — status flip only
          await mockIdentityRepo.patch(target.id, { suspensionExpiresAt: null });
          await mockStaffRepo.patchCasePayload(caseId, { reinstateApplied: true, decidedAt: new Date().toISOString() });
          await logAudit("account.action", actor.id, { targetId: target.id, action: "reinstate", reason: resolution, viaCase: caseId, adminAction: true });
          await recordAuthEvent({
            identityId: target.id,
            event: "account_action",
            email: target.email,
            ip: clientIpFrom(req.headers.get("x-forwarded-for")),
            userAgent: req.headers.get("user-agent"),
          });
          await notifyEnforcement({ recipientId: target.id, action: "reinstate", reason: resolution });
        } else {
          // Denied (resolve-without-reinstate) or dismissed: tell the appellant,
          // with the staff decision verbatim. Silent denials are a trust hole.
          await mockNotificationRepo.create({
            recipientId: target.id,
            type: "account_action",
            title: "Your appeal was reviewed",
            body:
              `We reviewed your appeal and ${action === "dismiss" ? "dismissed it" : "declined it"}; your account remains ${target.accountStatus ?? "restricted"}. ` +
              `Decision: ${resolution}` +
              " If you believe this is still a mistake, email support@voeq.ng.",
            refId: caseId,
          });
        }
      }
    }
  }
  await logAudit("case.triage", actor.id, { caseId, action, adminAction: true });
  await notifyStaff("system_alert", { refId: caseId });
  return NextResponse.json({ ok: true, case: result }, { status: 200 });
}
