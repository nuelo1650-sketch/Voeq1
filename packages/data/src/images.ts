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

import { uploadAndModerate } from "./media";
import type { ImageContext, UploadResult } from "./interfaces";

const CONTEXT_MAX_BYTES: Record<ImageContext, number> = {
  vendor_photo: 5 * 1024 * 1024,
  listing_photo: 8 * 1024 * 1024,
  message_attachment: 8 * 1024 * 1024,
};

const ALLOWED_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

export interface ImageUploadInput {
  fileName: string;
  bytes?: number;
  mimeType?: string;
  context: ImageContext;
  /** Test/override hook to force a decision (passed through to the mock). */
  force?: "pass" | "fail";
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
 * server-authoritative.
 */
export async function uploadImage(input: ImageUploadInput): Promise<UploadResult> {
  const { fileName, bytes, context, force } = input;

  // Context-aware size guard (client sends bytes; server enforces).
  if (typeof bytes === "number" && bytes > CONTEXT_MAX_BYTES[context]) {
    return { ok: false, reason: "File exceeds the maximum allowed size.", retryable: false };
  }
  if (!ALLOWED_EXT.test(fileName)) {
    return { ok: false, reason: "Unsupported image format.", retryable: false };
  }

  const result = await uploadAndModerate({ fileName, bytes, force });
  if (!result.ok) {
    return { ok: false, reason: result.reason ?? "Image did not pass automated content review.", retryable: true };
  }
  return { ok: true, url: result.url as string, publicId: publicIdFor(fileName), context };
}
