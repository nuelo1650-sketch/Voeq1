import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockIdentityRepo } from "@voeq/data/server";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * MONEY BAG F2 SAFETY NET — POST /api/account-choice
 * Records the identity's intent from the one-time choice screen. Auth-only;
 * only fills an EMPTY intent (never overwrites a real choice); a shopper
 * intent never touches vendorId.
 */

export async function POST(req: NextRequest) {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { intent?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (body.intent !== "shopper" && body.intent !== "vendor") {
    return NextResponse.json({ error: "intent must be shopper or vendor" }, { status: 400 });
  }

  // Never overwrite an existing intent or downgrade a vendor identity.
  if (identity.intent && identity.intent !== body.intent) {
    return NextResponse.json({ error: "Account type already set." }, { status: 409 });
  }

  await mockIdentityRepo.patch(identity.id, { intent: body.intent });
  return NextResponse.json({ ok: true, intent: body.intent });
}
