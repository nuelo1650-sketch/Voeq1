import { NextResponse } from "next/server";
import { mockReviewRepo } from "@voeq/data";

/**
 * GET /api/reviews/[vendorId] — public-read reviews + derived rating avg/count.
 * No auth required (public discovery).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ vendorId: string }> },
) {
  const { vendorId } = await params;
  const reviews = await mockReviewRepo.listByVendor(vendorId);
  const rated = reviews.filter((r) => typeof r.rating === "number");
  const ratingAvg = rated.length > 0 ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : null;
  return NextResponse.json({
    reviews,
    ratingAvg,
    ratingCount: rated.length,
  });
}
