import { NextRequest, NextResponse } from "next/server";
import { mockVendorRepo, mockStaffRepo, mockNotificationRepo, logAudit } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * VS7.8 — Vendor verification decision. requireCapability('vendor.verify').
 * Approving sets verified=true; denying sets verified=false. Audited.
 */
export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireCapability("vendor.verify");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }

  let body: { vendorId?: string; decision?: "approve" | "deny"; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const vendorId = typeof body.vendorId === "string" ? body.vendorId.trim() : "";
  const decision = body.decision;
  if (!vendorId || !decision) return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  const vendor = await mockVendorRepo.getById(vendorId);
  if (!vendor) return NextResponse.json({ error: "vendor_not_found" }, { status: 404 });

  const patched = await mockVendorRepo.patch(vendor.id, { verified: decision === "approve" });

  // QUEUE HYGIENE + VENDOR NOTIFICATION (2026-09-07, founder: "when I click
  // maybe a report or verify a vendor it doesn't filter as resolved or
  // approved, still stays there, and there is no notification to the vendor"):
  // 1) The verification case in staff_cases stays open forever after the
  //    decision — resolve it so the queue row disappears. Strict match on the
  //    payload's vendorId (NEVER fall back to "some open case" — that would
  //    resolve a different vendor's verification).
  const cases = await mockStaffRepo.listCases("verifications");
  const targetCase = cases.find(
    (c) =>
      (c.payload as Record<string, unknown> | null)?.vendorId === vendorId &&
      (c.status === "open" || c.status === "triaged"),
  );
  if (targetCase && (targetCase.status === "open" || targetCase.status === "triaged")) {
    await mockStaffRepo.resolveCase(
      targetCase.id,
      decision === "approve" ? "Vendor verified by staff." : `Verification denied${body.reason ? `: ${body.reason}` : "."}`,
      decision === "approve" ? "resolved" : "dismissed",
    );
  }
  if (vendor.identityId) {
    await mockNotificationRepo.create({
      recipientId: vendor.identityId,
      type: "system",
      title: decision === "approve" ? "You're verified ✓" : "Verification review completed",
      body:
        decision === "approve"
          ? "Voeq's team verified your business. Your storefront now shows the ✓ verified badge — students see it next to your name everywhere."
          : `We reviewed your verification request${body.reason ? ` and could not approve it: ${body.reason}` : ". You can update your business details and request verification again anytime."}`,
      refId: vendor.id,
    });
  }
  await logAudit("vendor.verify", actor.id, { vendorId, decision, reason: body.reason ?? null, adminAction: true });
  return NextResponse.json({ ok: true, verified: patched?.verified }, { status: 200 });
}
