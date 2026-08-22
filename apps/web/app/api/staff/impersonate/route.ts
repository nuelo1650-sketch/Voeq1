import { NextRequest, NextResponse } from "next/server";
import { mockIdentityRepo, mockSessionRepo, logAudit } from "@voeq/data";
import { requireCapability, SESSION_COOKIE } from "@/lib/session";

/**
 * VS7.14 — Impersonation START. super_admin only. Time-boxed (<=24h), reason>=20.
 * Creates a session for the target identity, returns it as a cookie + JSON. Audited.
 */
export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireCapability("staff.impersonate");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }

  let body: { targetIdentityId?: string; duration?: "1h" | "4h" | "24h"; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const targetId = typeof body.targetIdentityId === "string" ? body.targetIdentityId.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const duration = body.duration ?? "1h";
  if (!targetId) return NextResponse.json({ error: "missing_target" }, { status: 400 });
  if (reason.length < 20) return NextResponse.json({ error: "reason_min_20" }, { status: 400 });
  if (actor.id === targetId) return NextResponse.json({ error: "no_self_impersonate" }, { status: 400 });

  const target = await mockIdentityRepo.getById(targetId);
  if (!target) return NextResponse.json({ error: "target_not_found" }, { status: 404 });

  const durMs = duration === "24h" ? 86400000 : duration === "4h" ? 14400000 : 3600000;
  // Impersonation reuses the real session mechanism: a session for the target identity.
  const session = await mockSessionRepo.create(target.id);
  await logAudit("staff.impersonate.start", actor.id, {
    targetId,
    duration,
    reason,
    adminAction: true,
  });

  const res = NextResponse.json({ ok: true, sessionId: session.id, targetId });
  res.cookies.set(SESSION_COOKIE, session.id, { httpOnly: true, sameSite: "lax", maxAge: durMs / 1000 });
  return res;
}
