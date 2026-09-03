import { NextResponse } from "next/server";
import { mockReviewRepo, mockCommentRepo, mockAuthRepo } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * P-A round 60 — Moderation content queue (reviews + comments).
 * Staff-only (case.review). Lists recent reviews and comments with moderation
 * status so the Content tab can hide/show them (reviews via /api/staff/reviews,
 * comments via /api/staff/comments POST). No PII beyond author ids.
 * Batch 2: comments joined the queue (previously reviews-only).
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

  // Batch 2 — comment queue: recent comments INCLUDING hidden ones (staff need
  // to see what they hid to restore it). Author names resolved server-side.
  const comments = await mockCommentRepo.listRecent(100);
  const authorIds = Array.from(new Set(comments.map((c) => c.authorId)));
  const authors = await Promise.all(authorIds.map((aid) => mockAuthRepo.getIdentityById?.(aid)));
  const nameById = new Map<string, string>();
  authors.forEach((a) => { if (a) nameById.set(a.id, a.name); });
  const commentItems = comments.map((c) => ({
    id: c.id,
    listingId: c.listingId,
    authorId: c.authorId,
    authorName: nameById.get(c.authorId) ?? "Unknown",
    body: c.body,
    status: c.status,
    createdAt: c.createdAt,
  }));

  return NextResponse.json({ ok: true, items, comments: commentItems });
}
