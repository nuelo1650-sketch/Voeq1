import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  mockAuthRepo,
  mockMessageRepo,
  mockReportRepo,
  mockStaffRepo,
  notifyStaff,
  logAudit,
} from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS6.10 — Report a message. Any authenticated user can report any message.
 * Creates a Report (targetType "message") + a StaffCase, and queues a `system`
 * notification for staff with a "block while waiting" prompt (the /admin surface
 * that consumes it is VS7 — here we only author the data + queue).
 */
export async function POST(req: NextRequest) {
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { messageId?: string; category?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const messageId = typeof body.messageId === "string" ? body.messageId.trim() : "";
  if (!messageId) return NextResponse.json({ error: "messageId_required" }, { status: 400 });

  const message = await mockMessageRepo.getById(messageId);
  if (!message) return NextResponse.json({ error: "message_not_found" }, { status: 404 });

  // P-A round 57 (C8): validate category against the allowed set. The old code
  // cast ANY client string into the enum type — `category:"banana"` hit a PG
  // enum violation → 500 and the report was never created.
  const RAW_CATEGORIES = ["not_on_campus", "scam", "inappropriate", "impersonation", "harassment", "other"] as const;
  const rawCategory = typeof body.category === "string" ? body.category : "harassment";
  if (!RAW_CATEGORIES.includes(rawCategory as (typeof RAW_CATEGORIES)[number])) {
    return NextResponse.json({ error: "invalid category" }, { status: 400 });
  }
  const category = rawCategory as (typeof RAW_CATEGORIES)[number];
  const report = await mockReportRepo.create({
    reporterId: identity.id,
    targetType: "message",
    targetId: messageId,
    category,
    body: typeof body.body === "string" ? body.body : null,
  });
  const staffCase = await mockStaffRepo.create({
    queue: "content_moderation",
    decision: null,
    consequence: "pending_review",
  });

  // VS7.15 — notify staff on everything (single mechanism).
  await notifyStaff("new_report", { refId: staffCase.id });

  await logAudit("message.reported", identity.id, { messageId, reportId: report.id, caseId: staffCase.id });
  return NextResponse.json({ ok: true, report, caseId: staffCase.id }, { status: 200 });
}
