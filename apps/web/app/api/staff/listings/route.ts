import { NextRequest, NextResponse } from "next/server";
import { mockListingsRepo, logAudit } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * VS7.9 — Listing moderation. requireCapability('listing.moderate').
 * remove -> status='removed'; feature -> isFeatured=true + featuredUntil; unfeature -> false.
 * Audited.
 */
export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireCapability("listing.moderate");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }

  let body: { listingId?: string; action?: "remove" | "feature" | "unfeature"; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const action = body.action;
  if (!listingId || !action) return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  const listing = await mockListingsRepo.getById(listingId);
  if (!listing) return NextResponse.json({ error: "listing_not_found" }, { status: 404 });

  if (action === "remove") {
    // P-A round 79: was mockListingsRepo.remove() — a HARD delete. The route's
    // own contract (line 7) says "remove -> status='removed'" (soft), and the
    // response below reads updated?.status, which a hard delete makes undefined.
    // Soft-remove: keeps the row for auditing/restore, and publicOnly filters
    // status="active" so it drops off Explore immediately. Moderation must be
    // reversible, not destructive.
    await mockListingsRepo.update(listing.id, { status: "removed", isPublished: false });
  } else if (action === "feature") {
    const until = new Date(Date.now() + 30 * 86400000).toISOString();
    await mockListingsRepo.update(listing.id, { isFeatured: true, featuredUntil: until });
  } else {
    await mockListingsRepo.update(listing.id, { isFeatured: false, featuredUntil: null });
  }
  await logAudit("listing.moderate", actor.id, { listingId, action, adminAction: true });
  const updated = await mockListingsRepo.getById(listing.id);
  return NextResponse.json({ ok: true, status: updated?.status, isFeatured: updated?.isFeatured }, { status: 200 });
}
