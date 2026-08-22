import { NextRequest, NextResponse } from "next/server";
import { mockIdentityRepo, canPromote, logAudit } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * VS7.6 — Staff promotion. Server-authoritative via canPromote (Doc 09 §9.6).
 * Admin can promote to moderator/admin; only super_admin can grant super_admin.
 * Promotion is additive (never strips shopper/vendor).
 */
export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireCapability("staff.promote");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }

  let body: { targetIdentityId?: string; newRole?: "moderator" | "admin" | "super_admin" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const targetId = typeof body.targetIdentityId === "string" ? body.targetIdentityId.trim() : "";
  const newRole = body.newRole;
  if (!targetId || !newRole) return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  const target = await mockIdentityRepo.getById(targetId);
  if (!target) return NextResponse.json({ error: "target_not_found" }, { status: 404 });

  const check = canPromote(actor.staffRole, !!target.staffRole, newRole);
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 403 });

  const patched = await mockIdentityRepo.patch(target.id, { staffRole: newRole });
  await logAudit("staff.promote", actor.id, { targetId, newRole, adminAction: true });
  return NextResponse.json({ ok: true, identity: { id: patched?.id, staffRole: patched?.staffRole } }, { status: 200 });
}
