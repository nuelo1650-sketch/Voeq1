import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockReviewRepo, mockVendorRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * POST /api/reviews — create/update a review for a vendor (Doc 09 §9.8: one per
 * shopper-vendor, upsert). Auth required. Cannot review your own vendor account.
 */
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const vendorId = body?.vendorId;
  const rating = body?.rating;
  const reviewBody = body?.body;

  if (typeof vendorId !== "string" || !vendorId) {
    return NextResponse.json({ error: "invalid vendorId" }, { status: 400 });
  }
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be 1-5" }, { status: 400 });
  }
  if (typeof reviewBody !== "string" || reviewBody.trim().length < 10) {
    return NextResponse.json({ error: "body must be at least 10 characters" }, { status: 400 });
  }

  const vendor = await mockVendorRepo.getById(vendorId);
  if (!vendor) return NextResponse.json({ error: "not_found" }, { status: 404 });
  // Cannot review your own vendor account (one Identity preserved).
  if (vendor.identityId && vendor.identityId === identity.id) {
    return NextResponse.json({ error: "cannot_review_self" }, { status: 400 });
  }

  const review = await mockReviewRepo.create({
    shopperId: identity.id,
    vendorId,
    rating,
    body: reviewBody.trim(),
  });
  return NextResponse.json({ ok: true, review });
}
