import { NextRequest, NextResponse } from "next/server";
import { mockReviewRepo, logAudit } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * VS7.10 — Review moderation. requireCapability('review.moderate').
 * hide -> status='hidden'; show -> status='visible'. Audited.
 */
export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireCapability("review.moderate");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }

  let body: { reviewId?: string; action?: "hide" | "show"; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const reviewId = typeof body.reviewId === "string" ? body.reviewId.trim() : "";
  const action = body.action;
  if (!reviewId || !action) return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  const review = await mockReviewRepo.getById(reviewId);
  if (!review) return NextResponse.json({ error: "review_not_found" }, { status: 404 });

  const patched = await mockReviewRepo.patch(review.id, { status: action === "hide" ? "hidden" : "visible" });
  await logAudit("review.moderate", actor.id, { reviewId, action, adminAction: true });
  return NextResponse.json({ ok: true, status: patched?.status }, { status: 200 });
}
