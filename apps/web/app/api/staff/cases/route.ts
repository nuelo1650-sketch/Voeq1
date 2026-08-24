import { NextRequest, NextResponse } from "next/server";
import { mockStaffRepo, logAudit, notifyStaff } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * VS7.11 — Report triage. requireCapability('case.review').
 * assign -> set assignedTo (status open->triaged); resolve/dismiss -> set resolution + status.
 * Resolution text required (no empty resolutions). Audited.
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

  let body: { caseId?: string; action?: "assign" | "resolve" | "dismiss"; assignedTo?: string; resolution?: string };
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

  let result = null;
  if (action === "assign") {
    const assignedTo = typeof body.assignedTo === "string" ? body.assignedTo.trim() : actor.id;
    result = await mockStaffRepo.assignCase(caseId, assignedTo);
  } else {
    const resolution = typeof body.resolution === "string" ? body.resolution.trim() : "";
    if (resolution.length < 1) return NextResponse.json({ error: "resolution_required" }, { status: 400 });
    result = await mockStaffRepo.resolveCase(caseId, resolution, action === "resolve" ? "resolved" : "dismissed");
  }
  await logAudit("case.triage", actor.id, { caseId, action, adminAction: true });
  await notifyStaff("system_alert", { refId: caseId });
  return NextResponse.json({ ok: true, case: result }, { status: 200 });
}
