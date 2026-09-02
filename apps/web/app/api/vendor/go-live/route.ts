import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, goLive, mockVendorRepo, mockStaffRepo } from "@voeq/data";
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
    return NextResponse.json({ error: "Preconditions not met.", reasons: result.reasons, notes: result.notes }, { status: 409 });
  }

  // P-A round 57 (C7): verifications queue had NO producer — the admin tab was
  // forever empty and approve/deny could never act. Every go-live creates a
  // verification case so staff can review (VS7.8).
  try {
    const vendor = await mockVendorRepo.getById(identity.vendorId);
    await mockStaffRepo.create({
      queue: "verifications",
      decision: "pending_verification",
      consequence: null,
      payload: {
        vendorId: identity.vendorId,
        vendorName: vendor?.name ?? null,
        description: vendor?.description ?? null,
      },
    });
  } catch (e) {
    console.error(`[go-live] verification case create failed: ${e instanceof Error ? e.message : e}`);
  }

  return NextResponse.json({ ok: true, status: "live", reasons: result.reasons, notes: result.notes });
}
