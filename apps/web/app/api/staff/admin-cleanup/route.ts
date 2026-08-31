import { NextRequest, NextResponse } from "next/server";
import { adminCleanup } from "@voeq/db";
import { logAudit } from "@voeq/data";
import { requireCapability } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/staff/admin-cleanup
 *
 * Server-authoritative cleanup for demo/test data (2026-08-31). Staff-gated
 * (listing.moderate). ops:
 *  - delete-listing  { listingId }
 *  - delete-vendor   { vendorId }
 *  - delete-identity { identityId }
 *
 * Actual deletion lives in packages/db/src/admin-cleanup.ts (same drizzle
 * instance as the schema; child->parent order; no orphans). Audited.
 */
export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireCapability("listing.moderate");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }

  let body: {
    op?: "delete-listing" | "delete-vendor" | "delete-identity";
    listingId?: string;
    vendorId?: string;
    identityId?: string;
    reason?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const op = body.op;
  if (op !== "delete-listing" && op !== "delete-vendor" && op !== "delete-identity") {
    return NextResponse.json({ error: "unknown_op" }, { status: 400 });
  }

  try {
    await adminCleanup(op, {
      listingId: body.listingId,
      vendorId: body.vendorId,
      identityId: body.identityId,
    });
    await logAudit("listing.moderate", actor.id, { op, ...body, adminAction: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "cleanup failed";
    const status = msg === "missing_listingId" || msg === "missing_vendorId" || msg === "missing_identityId"
      ? 400
      : msg === "vendor_not_found" || msg === "identity_not_found"
        ? 404
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
