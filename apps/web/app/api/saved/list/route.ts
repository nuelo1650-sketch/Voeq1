import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockSavedListingRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * GET /api/saved — list the current shopper's saved listings + vendors.
 * Auth required.
 */
export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const items = await mockSavedListingRepo.list(identity.id);
  return NextResponse.json({
    savedListings: items.filter((i) => i.listingId).map((i) => i.listingId),
    savedVendors: items.filter((i) => i.vendorId).map((i) => i.vendorId),
  });
}
