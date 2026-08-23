import { NextResponse } from "next/server";
import { getCurrentIdentity } from "@/lib/session";

/**
 * GET /api/auth/status
 * Returns current auth state + unread message count (for nav badge).
 * K1.4: Used by LandingNav to determine which UI to show.
 */
export async function GET() {
  try {
    const identity = await getCurrentIdentity();
    
    if (!identity) {
      return NextResponse.json({ 
        authenticated: false,
        unreadCount: 0 
      });
    }

    // TODO: Get actual unread count from messaging system when Hermes wires SSE
    const unreadCount = 0;

    return NextResponse.json({
      authenticated: true,
      unreadCount,
      role: identity.role,
    });
  } catch (error) {
    return NextResponse.json({ 
      authenticated: false,
      unreadCount: 0 
    });
  }
}
