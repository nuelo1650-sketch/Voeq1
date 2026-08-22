import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockVendorRepo, mockListingsRepo, logAudit } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS5.6 — Create a listing (Phase B, step 2 of 2). Owner-only.
 * Validates required fields; defaults isPublished=true, status='active'.
 * New listing does not auto-promote to live (go-live is still gated in the UI).
 */
export async function POST(req: NextRequest) {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!identity.vendorId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
  const priceMinMinor = Number(body.priceMinMinor);
  if (title.length < 3) return NextResponse.json({ error: "title_min_3" }, { status: 400 });
  if (!categoryId) return NextResponse.json({ error: "category_required" }, { status: 400 });
  if (!Number.isFinite(priceMinMinor) || priceMinMinor <= 0) return NextResponse.json({ error: "price_invalid" }, { status: 400 });

  const priceMaxMinor = body.priceMaxMinor != null ? Number(body.priceMaxMinor) : null;
  const description = typeof body.description === "string" ? body.description : null;
  const images = Array.isArray(body.images) ? (body.images as string[]).filter((x) => typeof x === "string") : [];

  const listing = await mockListingsRepo.create({
    vendorId: identity.vendorId,
    title,
    priceMinMinor,
    priceMaxMinor: priceMaxMinor != null && Number.isFinite(priceMaxMinor) ? priceMaxMinor : null,
    categoryId,
    description,
    images,
    isPublished: true,
    status: "active",
  });

  await logAudit("vendor.listing.create", identity.id, { id: listing.id });
  return NextResponse.json({ ok: true, listing });
}
