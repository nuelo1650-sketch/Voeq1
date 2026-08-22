import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockReviewRepo, logAudit } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS5.10 — Vendor responds to a review. One response per review; 24h edit window
 * measured from the LATER of review.createdAt OR response.createdAt (founder
 * 2026-08-22, Option C). Server-authoritative — the client UI is advisory only.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity || !identity.vendorId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (text.length < 1) return NextResponse.json({ error: "response_empty" }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "response_too_long" }, { status: 400 });

  const existing = await mockReviewRepo.getById(id);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const hadResponse = !!existing.response;

  const updated = await mockReviewRepo.respond(id, identity.vendorId, text);
  if (!updated) return NextResponse.json({ error: "not_found_or_locked" }, { status: 404 });

  // One response per review: if a response already existed before this call,
  // it's locked (or the 24h window closed server-side). Signal locked.
  if (hadResponse) {
    return NextResponse.json({ ok: false, locked: true, review: updated });
  }

  await logAudit("vendor.review.respond", identity.id, { id });
  return NextResponse.json({ ok: true, review: updated });
}
