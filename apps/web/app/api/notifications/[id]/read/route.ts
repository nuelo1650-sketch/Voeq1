import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockNotificationRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * PATCH /api/notifications/[id]/read — mark a single notification read.
 * IDOR guard: only the recipient can mark their own read.
 */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ok = await mockNotificationRepo.markRead(id, identity.id);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
