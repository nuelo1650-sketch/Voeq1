import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, uploadImage, logAudit } from "@voeq/data/server";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS6.2 — Shared image upload endpoint. Auth required. Wraps the shared
 * `uploadImage` module (Sightengine + Cloudinary mocks). Returns UploadResult.
 * Moderation outcome is server-authoritative. No PII in audit.
 */
export async function POST(req: NextRequest) {
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { fileName?: string; context?: "vendor_photo" | "listing_photo" | "message_attachment"; bytes?: number; dataUrl?: string; mimeType?: string; existingCount?: number; force?: "pass" | "fail" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
  const context = body.context;
  if (!body.fileName || !context) {
    return NextResponse.json({ error: "fileName_and_context_required" }, { status: 400 });
  }

  const result = await uploadImage({ fileName, bytes: body.bytes, dataUrl: body.dataUrl, mimeType: body.mimeType, context, force: body.force, existingCount: body.existingCount });
  if (!result.ok) {
    await logAudit("image.upload.rejected", identity.id, { context, reason: result.reason });
    return NextResponse.json(result, { status: 422 });
  }
  await logAudit("image.upload.approved", identity.id, { context, publicId: result.publicId });
  return NextResponse.json(result, { status: 200 });
}
