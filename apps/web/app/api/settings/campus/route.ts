import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockIdentityRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * PATCH /api/settings/campus — switch the current identity's campus.
 * Auth required. Body: { campusId }.
 */
export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const campusId = typeof body?.campusId === "string" ? body.campusId : null;
  if (!campusId) return NextResponse.json({ error: "invalid campusId" }, { status: 400 });

  await mockIdentityRepo.patch(identity.id, { campus: campusId });
  return NextResponse.json({ ok: true, campus: campusId });
}
