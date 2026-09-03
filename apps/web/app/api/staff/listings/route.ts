import { NextRequest, NextResponse } from "next/server";
import {
  mockListingsRepo,
  mockVendorRepo,
  logAudit,
  notifyContentAction,
} from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * VS7.9 + staff batch 1 / task 9 — Listing moderation.
 *
 *   GET  /api/staff/listings?q=<term>   → moderation queue of listings
 *   POST { listingId, action, reason }  → remove | feature | unfeature
 *
 * remove  → status='removed' (SOFT — reversible, auditable; publicOnly drops
 *           it off Explore immediately). Requires a reason (>= 10 chars): the
 *           vendor receives it VERBATIM in a notification with appeal
 *           instructions, so an unexplained removal is not shippable.
 * feature → isFeatured + 30-day featuredUntil; vendor notified (positive news).
 * unfeature → silent (promo expiry needs no noise).
 *
 * Every mutating action is audited. Capability: listing.moderate.
 */
export async function GET(req: NextRequest) {
  try {
    await requireCapability("listing.moderate");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }

  const q = new URL(req.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  const listings = await mockListingsRepo.list();
  const filtered = (listings ?? [])
    .filter((l) => !q || l.title.toLowerCase().includes(q))
    .slice(0, 100);

  // Attach vendor names (moderation context: WHO owns this listing).
  const withVendors = await Promise.all(
    filtered.map(async (l) => {
      const vendor = await mockVendorRepo.getById(l.vendorId).catch(() => null);
      return {
        id: l.id,
        title: l.title,
        vendorId: l.vendorId,
        vendorName: vendor?.name ?? "—",
        status: l.status,
        isPublished: l.isPublished,
        isFeatured: l.isFeatured,
        featuredUntil: l.featuredUntil ?? null,
        priceMinMinor: l.priceMinMinor,
      };
    }),
  );
  return NextResponse.json({ ok: true, listings: withVendors });
}

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
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (action === "remove" && reason.length < 10) {
    return NextResponse.json({ error: "reason_required" }, { status: 400 });
  }

  const listing = await mockListingsRepo.getById(listingId);
  if (!listing) return NextResponse.json({ error: "listing_not_found" }, { status: 404 });

  if (action === "remove") {
    // P-A round 79: was mockListingsRepo.remove() — a HARD delete. The route's
    // own contract says "remove -> status='removed'" (soft), and the
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
  await logAudit("listing.moderate", actor.id, { listingId, action, reason: reason || null, adminAction: true });

  // Staff batch 1 (P2): the vendor learns WHY, verbatim, with an appeal path.
  // Resolve listing → vendor → identity; skip silently if the chain is broken.
  if (action === "remove" || action === "feature") {
    const vendor = await mockVendorRepo.getById(listing.vendorId).catch(() => null);
    if (vendor?.identityId) {
      await notifyContentAction({
        recipientId: vendor.identityId,
        title:
          action === "remove"
            ? `Your listing "${listing.title}" was removed`
            : `Your listing "${listing.title}" is now featured`,
        reason: reason || undefined,
        refId: listing.id,
      }).catch(() => undefined);
    }
  }

  const updated = await mockListingsRepo.getById(listing.id);
  return NextResponse.json({ ok: true, status: updated?.status, isFeatured: updated?.isFeatured }, { status: 200 });
}
