import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockFollowRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * GET /api/follow — list vendors the current shopper follows.
 * Auth required.
 */
export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const follows = await mockFollowRepo.list(identity.id);
  return NextResponse.json({ following: follows.map((f) => f.vendorId) });
}
