import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockIdentityRepo, mockAuthRepo, logAudit } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS2.8 — persist campus selection onto the current identity.
 * Vendor-intent users have campus set later in VS3 onboarding, so this is
 * optional for them (the route still accepts it; onboarding overrides).
 */
export async function POST(req: NextRequest) {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { campus?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const campus = body.campus;
  if (!campus || typeof campus !== "string") {
    return NextResponse.json({ error: "Campus is required." }, { status: 400 });
  }

  await mockIdentityRepo.patch(identity.id, { campus });
  await logAudit("campus.selected", identity.id, { campus });
  return NextResponse.json({ ok: true, redirect: "/onboarding/shopper" });
}
