import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockNotificationRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * POST /api/notifications/read-all — mark all of the current identity's
 * notifications read. Auth required.
 */
export async function POST(_req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await mockNotificationRepo.markAllRead(identity.id);
  return NextResponse.json({ ok: true });
}
