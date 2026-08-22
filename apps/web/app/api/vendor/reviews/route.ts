import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { mockAuthRepo, mockVendorRepo, mockReviewRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS5.9 — Vendor's own reviews.
 *   GET /api/vendor/reviews — list reviews for THIS vendor (owner-only).
 * (Responding is a sub-route: POST /api/vendor/reviews/[id]/respond.)
 */
export async function GET() {
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!identity.vendorId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const reviews = await mockReviewRepo.listByVendor(identity.vendorId);
  return NextResponse.json({ ok: true, reviews });
}
