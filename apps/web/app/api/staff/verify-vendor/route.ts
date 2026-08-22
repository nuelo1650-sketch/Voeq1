import { NextRequest, NextResponse } from "next/server";
import { mockVendorRepo, logAudit } from "@voeq/data";
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
  await logAudit("vendor.verify", actor.id, { vendorId, decision, reason: body.reason ?? null, adminAction: true });
  return NextResponse.json({ ok: true, verified: patched?.verified }, { status: 200 });
}
