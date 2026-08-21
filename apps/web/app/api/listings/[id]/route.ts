import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockListingsRepo, mockVendorRepo, enforceVisibilityAfterMutation } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * DELETE /api/listings/[id] — VS3 audit fix (#4).
 * Owner-only: the listing must belong to the vendor linked to the session identity.
 * After removal, the vendor's visibility is re-checked; if it drops below the
 * Phase B precondition (no listings left), status reverts to "pending_listings"
 * (visibility drift guard, Doc 13 §13.4).
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity || !identity.vendorId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const listing = await mockListingsRepo.getById(id);
  if (!listing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const vendor = await mockVendorRepo.getById(identity.vendorId);
  if (!vendor || listing.vendorId !== vendor.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const removed = await mockListingsRepo.remove(id);
  if (!removed) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Re-run visibility guard: deleting the last listing must revoke public visibility.
  await enforceVisibilityAfterMutation(vendor.id);

  return NextResponse.json({ ok: true });
}
