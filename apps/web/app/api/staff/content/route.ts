import { NextResponse } from "next/server";
import { mockReviewRepo } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * P-A round 60 — Moderation content queue (reviews).
 * Staff-only (case.review). Lists recent reviews with moderation status so the
 * Content tab can hide/show them (via /api/staff/reviews POST). No PII beyond
 * author ids.
 */
export async function GET() {
  let actor;
  try {
    actor = await requireCapability("case.review");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }

  const reviews = await mockReviewRepo.listAll();

  const items = (reviews ?? [])
    .slice()
    .sort((a, b) => ((b.createdAt ?? "") < (a.createdAt ?? "") ? -1 : 1))
    .slice(0, 100)
    .map((r) => ({
      id: r.id,
      authorId: r.authorId,
      vendorId: r.vendorId,
      rating: r.rating,
      body: r.body,
      status: r.status ?? "visible",
      createdAt: r.createdAt,
    }));

  return NextResponse.json({ ok: true, items });
}
