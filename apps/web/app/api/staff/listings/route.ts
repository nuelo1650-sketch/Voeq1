import { NextRequest, NextResponse } from "next/server";
import {
  mockListingsRepo,
  mockVendorRepo,
  mockNotificationRepo,
  mockSavedListingRepo,
  mockStaffRepo,
  logAudit,
} from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * VS7.9 + staff batch 1 / task 9 — Listing moderation.
 * ADMIN-05: richer rows (image thumb, category name via resolveCategoryMaps,
 * price as ₦, date, views/saves stats, listing ID) + recategorize dropdown.
 *
 *   GET  /api/staff/listings?q=<term>&seed=<all|seeds|real>  → moderation queue
 *   POST { listingId, action, reason, categoryId }           → remove | feature | unfeature | recategorize
 */

export async function GET(req: NextRequest) {
  try {
    await requireCapability("listing.moderate");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const seedFilter = url.searchParams.get("seed") ?? "all";

  const [listings, categoryMapsResult] = await Promise.all([
    mockListingsRepo.list(),
    import("@/../../packages/data/src/categories-resolver").then((m) => m.resolveCategoryMaps()).catch(() => null),
  ]);
  const categoryMaps: { slugToId: Record<string, string>; idToSlug: Record<string, string> } =
    categoryMapsResult ?? { slugToId: {}, idToSlug: {} };

  // Filter by search term (title, vendor name, listing id)
  const filtered = (listings ?? [])
    .filter((l) => {
      if (seedFilter === "seeds" && l.source !== "seed") return false;
      if (seedFilter === "real" && l.source === "seed") return false;
      if (!q) return true;
      return l.title.toLowerCase().includes(q)
        || l.id.toLowerCase().includes(q);
    })
    .slice(0, 100);

  // ADMIN-05: enrich rows with image thumb, category name, price, date, stats, ID
  const withVendors = await Promise.all(
    filtered.map(async (l) => {
      const vendor = await mockVendorRepo.getById(l.vendorId).catch(() => null);
      const saves = await mockSavedListingRepo.listByVendor(l.vendorId).catch(() => [] as { id: string }[]);
      const categorySlug = categoryMaps.idToSlug[l.categoryId] ?? l.categoryId;
      const priceFormatted = l.priceMaxMinor
        ? `₦${(l.priceMinMinor / 100).toLocaleString()}–₦${(l.priceMaxMinor / 100).toLocaleString()}`
        : `₦${(l.priceMinMinor / 100).toLocaleString()}`;

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
        priceFormatted,
        categoryId: l.categoryId,
        categorySlug,
        imageUrl: l.images?.[0] ?? null,
        createdAt: l.createdAt ?? null,
        saveCount: saves.length,
        // MONEY BAG S1: the seed marker — drives the SEED tag + hard-delete.
        source: l.source ?? null,
      };
    }),
  );
  return NextResponse.json({ ok: true, listings: withVendors }, { status: 200 });
}

export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireCapability("listing.moderate");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }

  let body: { listingId?: string; action?: "remove" | "feature" | "unfeature" | "recategorize"; reason?: string; categoryId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const action = body.action;
  if (!listingId || !action) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  // ADMIN-05: recategorize action
  if (action === "recategorize") {
    const categoryId = typeof body.categoryId === "string" ? body.categoryId.trim() : "";
    if (!categoryId) return NextResponse.json({ error: "missing_categoryId" }, { status: 400 });
    const listing = await mockListingsRepo.getById(listingId);
    if (!listing) return NextResponse.json({ error: "listing_not_found" }, { status: 404 });
    await mockListingsRepo.update(listing.id, { categoryId: categoryId as any });
    await logAudit("listing.recategorize", actor.id, { listingId, categoryId, adminAction: true });
    const updated = await mockListingsRepo.getById(listing.id);
    return NextResponse.json({ ok: true, categoryId: updated?.categoryId }, { status: 200 });
  }

  if (action === "remove" && reason.length < 10) {
    return NextResponse.json({ error: "reason_required" }, { status: 400 });
  }

  const listing = await mockListingsRepo.getById(listingId);
  if (!listing) return NextResponse.json({ error: "listing_not_found" }, { status: 404 });

  if (action === "remove") {
    await mockListingsRepo.update(listing.id, { status: "removed", isPublished: false });
  } else if (action === "feature") {
    const until = new Date(Date.now() + 30 * 86400000).toISOString();
    await mockListingsRepo.update(listing.id, { isFeatured: true, featuredUntil: until });
  } else {
    await mockListingsRepo.update(listing.id, { isFeatured: false, featuredUntil: null });
  }
  await logAudit("listing.moderate", actor.id, { listingId, action, reason: reason || null, adminAction: true });

  if (action === "remove" || action === "feature") {
    const vendor = await mockVendorRepo.getById(listing.vendorId).catch(() => null);
    if (vendor?.identityId) {
      await mockNotificationRepo.create({
        recipientId: vendor.identityId,
        type: action === "feature" ? "system" : "account_action",
        title:
          action === "remove"
            ? `Your listing "${listing.title}" was removed`
            : `Your listing "${listing.title}" is now featured ⭐`,
        body:
          action === "feature"
            ? "Voeq's team featured your listing — it will appear at the top of Explore and in the landing trending rail for 30 days."
            : `Your listing was removed by moderation.${reason ? ` Reason: ${reason}` : ""}`,
        refId: listing.id,
      }).catch(() => undefined);
    }
  }

  const updated = await mockListingsRepo.getById(listing.id);
  return NextResponse.json({ ok: true, status: updated?.status, isFeatured: updated?.isFeatured }, { status: 200 });
}
