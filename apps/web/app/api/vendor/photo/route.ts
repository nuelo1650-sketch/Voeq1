import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockVendorRepo, uploadImage, enforceVisibilityAfterMutation } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS5.5 — Consolidated vendor photo route (Flag 1: single source of truth).
 *   POST  /api/vendor/photo  — upload + moderate (Sightengine mock) + set profilePhotoUrl.
 *   DELETE /api/vendor/photo  — clear profilePhotoUrl; re-run visibility guard.
 * Owner-only (vendor resolved from session). Replaces the old split
 * upload-photo (POST) / photo (DELETE) routes.
 */

async function requireVendor() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  if (!sessionId) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity || !identity.vendorId) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  const vendor = await mockVendorRepo.getById(identity.vendorId);
  if (!vendor) return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) };
  return { identity, vendor };
}

export async function POST(req: NextRequest) {
  const auth = await requireVendor();
  if ("error" in auth) return auth.error;

  let body: { fileName?: string; force?: "pass" | "fail" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.fileName) return NextResponse.json({ error: "fileName is required." }, { status: 400 });

  const result = await uploadImage({ fileName: body.fileName, force: body.force, context: "vendor_photo" });
  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? "Upload rejected." }, { status: 422 });
  }

  const vendor = await mockVendorRepo.patch(auth.vendor.id, { profilePhotoUrl: result.url });
  return NextResponse.json({ ok: true, profilePhotoUrl: vendor?.profilePhotoUrl });
}

export async function DELETE() {
  const auth = await requireVendor();
  if ("error" in auth) return auth.error;

  await mockVendorRepo.patch(auth.vendor.id, { profilePhotoUrl: null });
  // Re-run visibility guard: removing the photo revokes public visibility if it was required.
  await enforceVisibilityAfterMutation(auth.vendor.id);

  return NextResponse.json({ ok: true, profilePhotoUrl: null });
}
