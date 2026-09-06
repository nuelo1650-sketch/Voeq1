import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockVendorRepo, mockStaffRepo, notifyStaff, logAudit } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * L1.3 (2026-09-06) — Vendor verification request.
 *
 * The old flow POSTed to /api/staff/cases, whose POST requires the STAFF
 * capability case.review — vendors got 403 and the request NEVER reached
 * staff (dead button, "Failed to submit request"). This route:
 *   - auths the SESSION VENDOR (owner-only, no staff capability),
 *   - creates a staff case in the 'verifications' queue directly,
 *   - fans out a staff notification,
 *   - guards duplicates (one open verification case per vendor),
 *   - audits the request.
 */
export async function POST() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  const identity = sessionId ? await mockAuthRepo.currentIdentity(sessionId) : null;
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!identity.vendorId) return NextResponse.json({ error: "forbidden_not_vendor" }, { status: 403 });

  const vendor = await mockVendorRepo.getById(identity.vendorId);
  if (!vendor) return NextResponse.json({ error: "vendor_not_found" }, { status: 404 });
  if (vendor.verified) {
    return NextResponse.json({ error: "already_verified", message: "Your storefront is already verified." }, { status: 409 });
  }

  // Duplicate guard: one OPEN verification case per vendor.
  const existing = await mockStaffRepo.listCases("verifications");
  const mine = existing.find(
    (c) => c.status === "open" && (c.payload as Record<string, unknown>)?.vendorId === vendor.id,
  );
  if (mine) {
    return NextResponse.json({ ok: true, alreadyOpen: true, caseId: mine.id, message: "Your verification request is already in review." }, { status: 200 });
  }

  const created = await mockStaffRepo.create({
    queue: "verifications",
    decision: null,
    consequence: null,
    payload: {
      vendorId: vendor.id,
      vendorName: vendor.name,
      campus: vendor.campus,
      requestedBy: identity.id,
      source: "vendor_self_request",
      description: "Vendor requesting verification badge",
    },
  });

  await notifyStaff("new_report", { refId: created.id });
  await logAudit("vendor.verification_requested", identity.id, { vendorId: vendor.id, caseId: created.id });

  return NextResponse.json({ ok: true, caseId: created.id, message: "Verification request submitted." }, { status: 200 });
}
