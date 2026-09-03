import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockNotificationRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * DELETE /api/notifications/[id] — P-A round 79.
 *
 * The /notifications page bulk-delete has been calling this endpoint since it
 * was built, but the route never existed (404). Recipient-scoped: a caller can
 * only delete their OWN notification (repo returns false otherwise -> 404).
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ok = await mockNotificationRepo.remove(id, identity.id);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
