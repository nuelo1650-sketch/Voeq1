import { NextRequest, NextResponse } from "next/server";
import { getCurrentIdentity } from "@/lib/session";

/**
 * GET /api/me/campus-migration-status — signals whether the current account is still
 * tagged with the legacy SA `nmu` slug and needs to pick a Nigerian campus.
 *
 * D-2 hybrid (confirmed):
 *  - Shoppers: soft-deprecated — keep browsing, non-blocking prompt.
 *  - Vendors: blocked from creating new listings (existing listings stay live) until they pick.
 *
 * Response: { needsNmuResolution: boolean, options: [{id, name}] }
 */
export async function GET(_req: NextRequest) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ needsNmuResolution: false, options: [] }, { status: 200 });
  }

  const options = [
    { id: "nmu-okerenkoko", name: "Nigeria Maritime University (Okerenkoko)" },
    { id: "nmu-kurutie", name: "Nigeria Maritime University (Kurutie)" },
  ];

  // Only the legacy SA slug triggers resolution. Nigerian slugs are already resolved.
  const needsNmuResolution = identity.campus === "nmu";
  return NextResponse.json({ needsNmuResolution, options }, { status: 200 });
}
