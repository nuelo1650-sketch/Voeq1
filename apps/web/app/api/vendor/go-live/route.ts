import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, goLive } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS3.6 — Go-live transition (shopper→vendor upgrade final step).
 * Enforces Phase A + Phase B preconditions, then flips vendor status to "live"
 * and widens the SAME identity's role to "vendor" (one Identity preserved).
 */
export async function POST() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!identity.vendorId) {
    return NextResponse.json({ error: "No vendor account to go live." }, { status: 400 });
  }

  const result = await goLive(identity.id);
  if (!result) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
  if (!result.ok) {
    return NextResponse.json({ error: "Preconditions not met.", reasons: result.reasons }, { status: 409 });
  }

  return NextResponse.json({ ok: true, status: "live", reasons: result.reasons });
}
