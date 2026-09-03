import { NextRequest, NextResponse } from "next/server";
import {
  mockStaffRepo,
  mockIdentityRepo,
  mockNotificationRepo,
  mockListingsRepo,
  mockVendorRepo,
  mockAuthEventStore,
  logAudit,
  notifyStaff,
  notifyEnforcement,
  canAccountAction,
  hasCapability,
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
  let actor;
  try {
    actor = await requireCapability("case.review");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }
  const { searchParams } = req.nextUrl;
  const queue = searchParams.get("queue") ?? "";

  // Batch 2 (T9): ?id=<caseId> returns the case DETAIL — the case itself plus
  // resolved subject/target context and a forensic timeline of the subject's
  // auth events since the case opened. Raw IPs follow the same rule as
  // /api/staff/users: only staff with account.suspend see them.
  const id = searchParams.get("id");
  if (id) {
    const all = await mockStaffRepo.listCases("");
    const theCase = all.find((c) => c.id === id);
    if (!theCase) return NextResponse.json({ ok: false, error: "case_not_found" }, { status: 404 });

    const payload = (theCase.payload ?? {}) as Record<string, unknown>;
    const subjectId = typeof payload.identityId === "string" ? payload.identityId : "";
    const targetListingId = typeof payload.targetId === "string" && payload.targetType === "listing" ? payload.targetId : "";
    const targetVendorId = typeof payload.targetId === "string" && payload.targetType === "vendor" ? payload.targetId : "";

    const [subject, targetListing, targetVendor] = await Promise.all([
      subjectId ? mockIdentityRepo.getById(subjectId).catch(() => null) : Promise.resolve(null),
      targetListingId ? mockListingsRepo.getById(targetListingId).catch(() => null) : Promise.resolve(null),
      targetVendorId ? mockVendorRepo.getById(targetVendorId).catch(() => null) : Promise.resolve(null),
    ]);

    const maySeeRawIp = hasCapability(actor.staffRole, "account.suspend");
    let timeline: Array<{ event: string; at: string; userAgent: string | null; ip?: string | null }> = [];
    if (subjectId) {
      const since = theCase.createdAt ?? undefined;
      const events = await mockAuthEventStore
        .queryBy({ identityId: subjectId, limit: 50 })
        .catch(() => []);
      timeline = events
        .filter((e) => !since || e.at >= since)
        .map((e) => ({
          event: e.event,
          at: e.at,
          userAgent: e.userAgent ?? null,
          ip: maySeeRawIp ? e.ip : undefined,
        }));
    }

    return NextResponse.json({
      ok: true,
      case: theCase,
      subject: subject
        ? {
            id: subject.id,
            email: subject.email,
            name: subject.name,
            role: subject.role,
            staffRole: subject.staffRole,
            accountStatus: subject.accountStatus ?? "active",
          }
        : subjectId
          ? { id: subjectId, deleted: true }
          : null,
      target: targetListing
        ? { kind: "listing", id: targetListing.id, title: targetListing.title, status: targetListing.status, isPublished: targetListing.isPublished, vendorId: targetListing.vendorId }
        : targetVendor
          ? { kind: "vendor", id: targetVendor.id, name: targetVendor.name, status: targetVendor.status }
          : targetListingId || targetVendorId
            ? { kind: payload.targetType ?? "unknown", id: targetListingId || targetVendorId, missing: true }
            : null,
      timeline,
    });
  }

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

  let body: { caseId?: string; action?: "assign" | "resolve" | "dismiss" | "reopen" | "note"; assignedTo?: string; resolution?: string; reinstate?: boolean; note?: string };
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
  } else if (action === "reopen") {
    // Batch 2 (T9): a closed case that needs another look goes back to open.
    // Resolution text is cleared (the repo sets it null) so the drawer never
    // shows a stale decision next to an OPEN pill.
    result = await mockStaffRepo.reopenCase(caseId);
  } else if (action === "note") {
    // Batch 2 (T9): internal staff note — appended to payload.notes (JSONB
    // merge replaces the array wholesale, so we read-modify-write). Never
    // shown to the subject; it is staff working context, not a decision.
    const text = typeof body.note === "string" ? body.note.trim() : "";
    if (text.length < 2 || text.length > 2000) return NextResponse.json({ error: "note_invalid" }, { status: 400 });
    const existingNotes = Array.isArray(theCase.payload?.notes) ? (theCase.payload.notes as unknown[]) : [];
    result = await mockStaffRepo.patchCasePayload(caseId, {
      notes: [...existingNotes, { at: new Date().toISOString(), by: actor.id, text }],
    });
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
