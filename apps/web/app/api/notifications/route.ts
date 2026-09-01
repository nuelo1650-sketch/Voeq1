import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockNotificationRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * GET /api/notifications — list current identity's notifications (newest first)
 * + unread count. Auth required.
 */
export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    // Anonymous: empty state with 200 (page redirects to login anyway — this
    // kills the 401 console noise the matrix caught on /notifications).
    return NextResponse.json({ notifications: [], unread: 0 });
  }

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) {
    return NextResponse.json({ notifications: [], unread: 0 });
  }

  const notifications = await mockNotificationRepo.list(identity.id);
  const unread = notifications.filter((n) => !n.read).length;
  return NextResponse.json({ notifications, unread });
}
