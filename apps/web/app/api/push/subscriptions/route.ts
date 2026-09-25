import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";
import { mockAuthRepo } from "@voeq/data";
import { mockPushSubscriptionRepo } from "@voeq/data";

/**
 * NOT-10: Push subscription management (self-service — user manages their own device subscriptions).
 * GET  — list the current user's subscriptions.
 * DELETE — remove one of the current user's subscriptions by endpoint (IDOR-guarded:
 *          the endpoint must belong to the authenticated identity).
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value ?? null;
    const identity = await mockAuthRepo.currentIdentity(sessionId);
    if (!identity) return NextResponse.json({ error: "unauth" }, { status: 401 });
    const subs = await mockPushSubscriptionRepo.listForIdentity(identity.id);
    return NextResponse.json({ ok: true, subscriptions: subs }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value ?? null;
    const identity = await mockAuthRepo.currentIdentity(sessionId);
    if (!identity) return NextResponse.json({ error: "unauth" }, { status: 401 });
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");
    if (!endpoint) return NextResponse.json({ error: "missing_endpoint" }, { status: 400 });
    // IDOR guard: only delete if the endpoint belongs to the authenticated identity
    await mockPushSubscriptionRepo.deleteForIdentity(identity.id, endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
