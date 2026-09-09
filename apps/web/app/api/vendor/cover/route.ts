import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockVendorRepo, uploadImage, enforceVisibilityAfterMutation } from "@voeq/data/server";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * MONEY BAG D2a (A17 hybrid banner) — vendor COVER photo route.
 *   POST   /api/vendor/cover  — persist the cover URL (direct-upload mode) or
 *                              legacy dataUrl upload; moderates like any photo.
 *   DELETE /api/vendor/cover  — clear the cover; the storefront banner slot
 *                              reverts to the system-generated brand banner.
 * Owner-only (vendor resolved from session). Mirrors /api/vendor/photo but
 * writes `photoCover` — the banner slot — not profilePhotoUrl.
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

  let body: { fileName?: string; dataUrl?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Direct-upload mode (same contract as /api/vendor/photo): the browser has
  // already uploaded to Cloudinary via signed token + moderation. Persist only.
  if (body.url) {
    if (!/^https:\/\/(res\.)?cloudinary\.com\//.test(body.url)) {
      return NextResponse.json({ error: "Only Cloudinary-hosted photos are allowed." }, { status: 422 });
    }
    const vendor = await mockVendorRepo.patch(auth.vendor.id, { photoCover: body.url });
    return NextResponse.json({ ok: true, photoCover: vendor?.photoCover ?? body.url });
  }

  // Legacy dataUrl path (tests/mock): full pipeline (upload + moderate).
  if (!body.fileName) return NextResponse.json({ error: "fileName is required." }, { status: 400 });
  const result = await uploadImage({ fileName: body.fileName, dataUrl: body.dataUrl, context: "vendor_photo" });
  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? "Upload rejected." }, { status: 422 });
  }

  const vendor = await mockVendorRepo.patch(auth.vendor.id, { photoCover: result.url });
  return NextResponse.json({ ok: true, photoCover: vendor?.photoCover });
}

export async function DELETE() {
  const auth = await requireVendor();
  if ("error" in auth) return auth.error;

  await mockVendorRepo.patch(auth.vendor.id, { photoCover: null });
  return NextResponse.json({ ok: true, photoCover: null });
}
