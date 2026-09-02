/**
 * VS6.1 — Shared image infrastructure module.
 *
 * Single source of truth for the upload pipeline. Wraps the VS3.3 mocks
 * (`uploadAndModerate` / `mockCloudinaryUpload` / `mockSightengineModerate`) so
 * every consumer (vendor photo, listing photo, future attachments) uses ONE
 * pipeline. Phase 9 swaps the mock internals for real Cloudinary + Sightengine
 * behind these same signatures — the app depends only on `uploadImage`.
 *
 * Moderation is SERVER-AUTHORITATIVE: the client can never mark an image
 * approved. Rejected uploads return a clear reason + retryable flag.
 */

import { uploadAndModerate, uploadAndModerateByUrl } from "./media";
import type { ImageContext, UploadResult } from "./interfaces";

/** D.4 — Hard cap on images per listing (defense in depth with listing CRUD). */
export const MAX_IMAGES_PER_LISTING = 5;

const CONTEXT_MAX_BYTES: Record<ImageContext, number> = {
  vendor_photo: 5 * 1024 * 1024,
  listing_photo: 8 * 1024 * 1024,
  message_attachment: 8 * 1024 * 1024,
};

const ALLOWED_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

export interface ImageUploadInput {
  fileName: string;
  bytes?: number;
  /** base64 data URL sent by the web client. */
  dataUrl?: string;
  mimeType?: string;
  context: ImageContext;
  /** Test/override hook to force a decision (passed through to the mock). */
  force?: "pass" | "fail";
  /** D.4 — number of images already attached; rejects if this + 1 > cap. */
  existingCount?: number;
}

/** Derive a publicId from the filename (sanitized). */
function publicIdFor(fileName: string): string {
  const slug = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase() || "asset";
  const seed = Math.random().toString(36).slice(2, 8);
  return `${slug}-${seed}`;
}

/**
 * Upload + moderate an image. Returns an UploadResult (ok + url, or rejected
 * with a reason). Validates size/type BEFORE moderation; moderation outcome is
 * server-authoritative. Enforces the 5-image cap when existingCount is given.
 */
export async function uploadImage(input: ImageUploadInput): Promise<UploadResult> {
  const { fileName, bytes, context, force, dataUrl, existingCount } = input;

  // D.4 — 5-image cap (listing photos only; vendor photo is singular).
  if (context === "listing_photo" && typeof existingCount === "number") {
    if (existingCount >= MAX_IMAGES_PER_LISTING) {
      return {
        ok: false,
        reason: `You can attach at most ${MAX_IMAGES_PER_LISTING} images per listing.`,
        retryable: false,
      };
    }
  }

  // Context-aware size guard. P-A round 57 (C5): NEVER trust the client's
  // `bytes` — it was self-reported, and `bytes:1` on a 5.8MB payload sailed
  // through the 5MB cap into Cloudinary. Measure the ACTUAL base64 payload
  // the client sent; the sent value is a hint only.
  const measuredBytes = (() => {
    if (typeof dataUrl === "string" && dataUrl.length > 0) {
      const b64 = dataUrl.includes(",") ? dataUrl.split(",")[1] ?? "" : dataUrl;
      return Math.round((b64.length * 3) / 4);
    }
    return typeof bytes === "number" ? bytes : 0;
  })();
  if (measuredBytes > CONTEXT_MAX_BYTES[context]) {
    return { ok: false, reason: "File exceeds the maximum allowed size.", retryable: false };
  }
  if (!ALLOWED_EXT.test(fileName)) {
    return { ok: false, reason: "Unsupported image format.", retryable: false };
  }

  const result = await uploadAndModerate({ fileName, bytes, dataUrl, force });
  if (!result.ok) {
    return { ok: false, reason: result.reason ?? "Image did not pass automated content review.", retryable: true };
  }
  return { ok: true, url: result.url as string, publicId: publicIdFor(fileName), context };
}

/**
 * P-A round 65 — DIRECT upload path. The file was uploaded by the BROWSER to
 * Cloudinary (signed token from /api/images/sign); here we only moderate the
 * returned URL (Sightengine), enforce the Cloudinary-only gate (C13), and on
 * rejection remove the already-uploaded asset (no orphaning). Size/type
 * checks run client-side with precise errors before the upload starts.
 */
export async function uploadImageByUrl(input: ImageUploadInput & { url: string; publicId?: string }): Promise<UploadResult> {
  const { fileName, context, force, url, publicId, existingCount } = input;

  // D.4 — 5-image cap (listing photos only; vendor photo is singular).
  if (context === "listing_photo" && typeof existingCount === "number") {
    if (existingCount >= MAX_IMAGES_PER_LISTING) {
      return {
        ok: false,
        reason: `You can attach at most ${MAX_IMAGES_PER_LISTING} images per listing.`,
        retryable: false,
      };
    }
  }

  // Cloudinary-only gate (C13 keeps arbitrary external URLs out).
  if (!/^https:\/\/(res\.)?cloudinary\.com\//.test(url)) {
    return { ok: false, reason: "Only Cloudinary-hosted photos are allowed.", retryable: false };
  }

  const result = await uploadAndModerateByUrl({ fileName, url, publicId, force, context });
  if (!result.ok) {
    return { ok: false, reason: result.reason ?? "Image did not pass automated content review.", retryable: result.retryable ?? true };
  }
  return { ok: true, url: result.url as string, publicId: publicId ?? publicIdFor(fileName), context };
}
