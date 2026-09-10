import { NextRequest, NextResponse } from "next/server";
import { mockListingsRepo, logAudit } from "@voeq/data";
import { requireCapability } from "@/lib/session";
import { adminCleanup } from "@voeq/db";

/**
 * MONEY BAG S1 (E3b) — staff HARD-DELETE for seed listings.
 *   POST { listingId } — permanently deletes a listing whose source='seed'.
 *
 * Rules from the founder's seed contract:
 *  - ONLY rows with listings.source='seed' can be hard-deleted here. Real
 *    listings keep soft-delete (the moderation path) — this route refuses
 *    them explicitly (409 not_a_seed).
 *  - Hard delete is child-first via adminCleanup("delete-listing") — the
 *    same audited cascade as account deletion (no orphan rows).
 *  - Every call is audit-logged with the actor and the listing title.
 *  - Seeds are founder-commissioned onto demo vendor accounts: no vendor
 *    notification is sent (it would be noise).
 *  - Gate: requireCapability("listing.moderate") — same as the moderation
 *    route; the panel only shows the button to those callers anyway.
 */

export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireCapability("listing.moderate");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }

  let body: { listingId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) return NextResponse.json({ error: "missing_listingId" }, { status: 400 });

  const listing = await mockListingsRepo.getById(listingId);
  if (!listing) return NextResponse.json({ error: "listing_not_found" }, { status: 404 });

  // THE GUARD: hard-delete is for seeds only. Real listings go through the
  // moderation soft-delete route — irreversible deletion of a real vendor's
  // work must never happen by accident here.
  if (listing.source !== "seed") {
    return NextResponse.json(
      { error: "not_a_seed", detail: "Only seed listings can be permanently deleted. Use the moderation remove action for real listings." },
      { status: 409 },
    );
  }

  await adminCleanup("delete-listing", { listingId });
  await logAudit("listing.seed_delete", actor.id, { listingId, title: listing.title, adminAction: true });

  return NextResponse.json({ ok: true, deleted: listingId, title: listing.title });
}
