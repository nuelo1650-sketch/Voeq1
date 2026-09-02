import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, uploadImage, uploadImageByUrl, logAudit } from "@voeq/data/server";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS6.2 / P-A round 65 — Shared image upload endpoint. Auth required.
 *
 * TWO call paths:
 *   1. DIRECT (recommended): browser uploads the file straight to Cloudinary
 *      (see /api/images/sign), then sends ONLY the URL here. This route
 *      moderates the URL via Sightengine and records the publicId.
 *      -> body: { fileName, context, url, publicId, mimeType }
 *   2. LEGACY (data URL): body: { fileName, context, dataUrl, ... } — kept for
 *      the in-memory mock harness/dev tooling. Not used by the app's upload
 *      composer anymore.
 *
 * Moderation outcome is server-authoritative. No PII in audit.
 */
export async function POST(req: NextRequest) {
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: {
    fileName?: string;
    context?: "vendor_photo" | "listing_photo" | "message_attachment";
    bytes?: number;
    dataUrl?: string;
    mimeType?: string;
    existingCount?: number;
    force?: "pass" | "fail";
    url?: string;
    publicId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
  const context = body.context;
  if (!fileName || !context) {
    return NextResponse.json({ error: "fileName_and_context_required" }, { status: 400 });
  }

  const result = body.url
    ? await uploadImageByUrl({ fileName, context, url: body.url, publicId: body.publicId, mimeType: body.mimeType, force: body.force, existingCount: body.existingCount })
    : await uploadImage({ fileName, bytes: body.bytes, dataUrl: body.dataUrl, mimeType: body.mimeType, context, force: body.force, existingCount: body.existingCount });

  if (!result.ok) {
    await logAudit("image.upload.rejected", identity.id, { context, reason: result.reason });
    return NextResponse.json(result, { status: 422 });
  }
  await logAudit("image.upload.approved", identity.id, { context, publicId: result.publicId });
  return NextResponse.json(result, { status: 200 });
}
