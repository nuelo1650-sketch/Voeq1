import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockVendorRepo, enforceVisibilityAfterMutation } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * DELETE /api/vendor/photo — VS3 audit fix (#5).
 * Owner-only: clears the vendor's profilePhotoUrl. After removal, the visibility
 * guard reverts status to "pending_listings" if the photo was a Phase B precondition
 * (Doc 13 §13.4). Clears the local draft photo state too via the client.
 */
export async function DELETE(_req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity || !identity.vendorId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const vendor = await mockVendorRepo.getById(identity.vendorId);
  if (!vendor) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await mockVendorRepo.patch(vendor.id, { profilePhotoUrl: null });

  // Re-run visibility guard: removing the photo revokes public visibility if it was required.
  await enforceVisibilityAfterMutation(vendor.id);

  return NextResponse.json({ ok: true, profilePhotoUrl: null });
}
