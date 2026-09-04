import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  mockAuthRepo,
  mockVendorRepo,
  mockListingsRepo,
  mockNotificationRepo,
  enforceVisibilityAfterMutation,
  logAudit,
  MAX_IMAGES_PER_LISTING,
} from "@voeq/data/server";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS5.7 / VS5.8 — Edit or remove a single listing. Owner-only:
 * the listing's vendorId must match the session's vendorId (IDOR guard).
 *   GET    — public listing detail (real Neon, server-side).
 *   PATCH  — partial update (title/description/price/category/images).
 *   DELETE — remove + re-run visibility guard (last listing removed => revert to pending_listings).
 */

/**
 * GET /api/listings/[id] — public listing detail (P-A fix, 2026-08-31).
 * The listing detail page previously imported loadListing into the CLIENT
 * bundle where USE_REAL=false -> mock repo -> null -> "Listing not found"
 * even though the row exists in Neon. This route runs server-side (real DB).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await mockListingsRepo.getById(id);
  if (!listing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ listing });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!identity.vendorId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const listing = await mockListingsRepo.getById(id);
  if (!listing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (listing.vendorId !== identity.vendorId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim().length >= 3) patch.title = body.title.trim();
  if (typeof body.description === "string") patch.description = body.description;
  // P-A round 57 (C9): persist the one-liner on edit too (was validated + dropped).
  if (typeof body.shortDescription === "string") patch.shortDescription = body.shortDescription;
  if (body.priceMinMinor != null) {
    const p = Number(body.priceMinMinor);
    if (Number.isFinite(p) && p > 0) patch.priceMinMinor = p;
  }
  if (body.priceMaxMinor != null) {
    const p = Number(body.priceMaxMinor);
    patch.priceMaxMinor = Number.isFinite(p) && p > 0 ? p : null;
  }
  if (typeof body.categoryId === "string" && body.categoryId) patch.categoryId = body.categoryId;
  if (Array.isArray(body.images)) {
    // P-A round 57 (C13): images must come from the moderation-approved
    // pipeline (Cloudinary). Arbitrary external URLs were accepted, bypassing
    // Sightengine entirely. Our own demo/seed URLs are Cloudinary-hosted too.
    const imgs = (body.images as string[]).filter((x) => typeof x === "string" && /^https:\/\/(res\.)?cloudinary\.com\//.test(x));
    if (imgs.length !== (body.images as string[]).length) {
      return NextResponse.json({ error: "Only Cloudinary-hosted images are allowed." }, { status: 400 });
    }
    if (imgs.length > MAX_IMAGES_PER_LISTING) {
      return NextResponse.json(
        { error: `At most ${MAX_IMAGES_PER_LISTING} images per listing.` },
        { status: 400 },
      );
    }
    patch.images = imgs;
  }

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });

  // ================= LISTING INTEGRITY (2026-09-05, David-approved) =================
  // Tier B fields (title/category/price-min) on an ENGAGED listing must stay
  // "the same thing". Compute engagement + similarity, classify, audit, act.
  // (Engagement queries live in @voeq/db so drizzle types line up.)
  const TIER_B_KEYS = ["title", "categoryId", "priceMinMinor"] as const;
  const tierBChanged = TIER_B_KEYS.filter((k) => k in patch);
  const dbPkg = await import("@voeq/db");
  const { getDb, listingEdits } = dbPkg;
  const { engagementScore, similarityScore, classify, getEngagement, getSavers } = dbPkg;
  const { randomUUID } = await import("crypto");

  const engagement = await getEngagement(id);
  const eScore = engagementScore(engagement);

  const after = {
    title: (patch.title as string) ?? listing.title,
    categoryId: (patch.categoryId as string) ?? listing.categoryId,
    priceMinMinor: (patch.priceMinMinor as number) ?? listing.priceMinMinor,
    description: (patch.description as string | undefined) !== undefined ? (patch.description as string | null) : listing.description,
  };

  // TIER C: category is locked once the listing has ANY engagement.
  if ("categoryId" in patch && patch.categoryId !== listing.categoryId && eScore > 0) {
    await getDb().insert(listingEdits).values({
      id: randomUUID(), listingId: id, vendorId: identity.vendorId, at: new Date().toISOString(),
      fields: { categoryId: { from: listing.categoryId, to: patch.categoryId } },
      similarity: 0, engagement, action: "blocked",
    });
    await logAudit("vendor.listing.edit_blocked", identity.id, { id, reason: "category_locked_engaged", engagement: eScore });
    return NextResponse.json({
      error: "category_locked",
      message: "Category can't be changed once shoppers have engaged with this listing. Delete it and create a new listing instead.",
    }, { status: 409 });
  }

  // similarity check fires only when Tier B identity fields actually change
  let action: "applied" | "flagged" | "blocked" = "applied";
  let similarity: number | null = null;
  if (tierBChanged.length > 0 && eScore > 0) {
    similarity = similarityScore({
      before: { title: listing.title, categoryId: listing.categoryId, priceMinMinor: listing.priceMinMinor, description: listing.description },
      after,
    });
    action = classify(similarity);
    // audit EVERY tier-B attempt on engaged listings (applied/flagged/blocked)
    await getDb().insert(listingEdits).values({
      id: randomUUID(), listingId: id, vendorId: identity.vendorId, at: new Date().toISOString(),
      fields: Object.fromEntries(tierBChanged.map((k) => [k, { from: (listing as unknown as Record<string, unknown>)[k], to: patch[k] }])),
      similarity, engagement, action,
    });
    if (action === "blocked") {
      await logAudit("vendor.listing.edit_blocked", identity.id, { id, reason: "different_product", similarity });
      return NextResponse.json({
        error: "different_product",
        message: `This edit would make it a different product (integrity ${similarity}/100). Delete this listing and create a new one instead — it keeps the platform honest and takes under a minute.`,
        similarity,
      }, { status: 409 });
    }
  }

  const updated = await mockListingsRepo.update(id, patch as never);
  await logAudit("vendor.listing.update", identity.id, { id, fields: Object.keys(patch), similarity, action });

  // flagged edits: savers get told what changed (consumer protection)
  if (action === "flagged") {
    const savers = await getSavers(id);
    for (const row of savers) {
      await mockNotificationRepo.create({
        recipientId: row.shopperId,
        type: "system",
        title: "An item you saved changed",
        body: `"${listing.title}" is now "${after.title}"${listing.priceMinMinor !== after.priceMinMinor ? ` — price ₦${Math.round(listing.priceMinMinor / 100).toLocaleString("en-NG")} → ₦${Math.round(after.priceMinMinor / 100).toLocaleString("en-NG")}` : ""}. Un-save it if that's not for you anymore.`,
        refId: id,
      });
    }
    await logAudit("vendor.listing.edit_flagged", identity.id, { id, similarity, saversNotified: savers.length });
  }

  return NextResponse.json({ ok: true, listing: updated, integrity: { similarity, action, engagement: eScore } });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!identity.vendorId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const listing = await mockListingsRepo.getById(id);
  if (!listing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (listing.vendorId !== identity.vendorId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await mockListingsRepo.remove(id);
  // Re-run visibility guard: removing the last listing revokes public visibility.
  await enforceVisibilityAfterMutation(identity.vendorId);
  await logAudit("vendor.listing.delete", identity.id, { id });

  return NextResponse.json({ ok: true });
}
