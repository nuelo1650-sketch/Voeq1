import { NextResponse } from "next/server";
import { getCurrentIdentity } from "@/lib/session";
import { mockConversationRepo, mockMessageRepo } from "@voeq/data";
import type { AuthStatusResponse } from "@/lib/authStatus";

/**
 * GET /api/auth/status
 * Returns current auth state + unread message count (for nav badge).
 * K1.4: Used by LandingNav to determine which UI to show.
 */
export async function GET() {
  try {
    const identity = await getCurrentIdentity();

    if (!identity) {
      const body: AuthStatusResponse = { authenticated: false, unreadCount: 0 };
      return NextResponse.json(body);
    }

    // Real unread count: messages in any of the user's conversations where the
    // sender is someone else and the message hasn't been marked read yet.
    // Mirrors the logic in /api/home so the nav badge matches the messages page.
    const conversations = await mockConversationRepo.listForIdentity(identity.id);
    let unreadCount = 0;
    for (const c of conversations) {
      const msgs = await mockMessageRepo.listByConversation(c.id, null, 200);
      unreadCount += msgs.filter(
        (m) => m.senderId !== identity.id && m.state !== "read",
      ).length;
    }

    const body: AuthStatusResponse = {
      authenticated: true,
      unreadCount,
      role: identity.role,
    };
    return NextResponse.json(body);
  } catch (error) {
    const body: AuthStatusResponse = { authenticated: false, unreadCount: 0 };
    return NextResponse.json(body);
  }
}
