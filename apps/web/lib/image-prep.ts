"use client";

/**
 * P-A round 65 — browser-side image preparation.
 *
 * Outputs a Blob/File ready for DIRECT Cloudinary upload (no base64 anywhere
 * in the new pipeline). `dataUrl` is still produced for the LEGACY
 * /api/images/upload data-url path (message attachments / tests / mock).
 *
 * HEIC: browsers can't decode HEIC, so this function never converts it —
 * but the DIRECT path no longer needs to: Cloudinary decodes HEIC server-side.
 * The old 5MB HEIC block existed only because base64-in-JSON hit Next's body
 * wall; the direct path has no such wall.
 */

export interface PreparedImage {
  /** Blob to upload directly to Cloudinary (compressed when possible). */
  blob: Blob;
  mimeType: string;
  bytes: number;
  compressed: boolean;
  /** Legacy base64 data URL (kept for the legacy endpoint/tests). */
  dataUrl: string;
}

export type PrepareResult = PreparedImage | { error: string };

const MAX_DIM = 1600;
const JPEG_QUALITY = 0.82;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read_failed"));
    r.readAsDataURL(file);
  });
}

/** canvas.toBlob promisified (prefer it; single path, no double base64). */
function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob_failed"))), mime, quality);
  });
}

export async function prepareImageForUpload(file: File): Promise<PrepareResult> {
  const type = (file.type || "").toLowerCase();

  // JPEG/PNG/WebP — client checks + reencode (already small? keep). All
  // sizes subject to a hard 15MB sanity cap (Cloudinary's own limit).
  if (!/image\/(jpeg|png|webp|heic|heif)/.test(type)) {
    return { error: "Unsupported image type. Use JPEG, PNG or WebP." };
  }

  // HEIC/HEIF — browsers can't draw these to canvas. Send AS-IS to Cloudinary
  // (it decodes HEIC server-side; new DIRECT path has no body wall). Only a
  // hard-capped sanity check remains.
  if (/heic|heif/i.test(type)) {
    if (file.size > 15 * 1024 * 1024) {
      return { error: "This photo is larger than 15MB. Pick a smaller one." };
    }
    const originalDataUrl = await readAsDataUrl(file).catch(() => "");
    return {
      blob: file,
      mimeType: "image/heic",
      bytes: file.size,
      compressed: false,
      dataUrl: originalDataUrl,
    };
  }

  let originalDataUrl = "";
  try {
    originalDataUrl = await readAsDataUrl(file);
  } catch {
    return { error: "Could not read this image on your device." };
  }

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("decode_failed"));
      i.src = originalDataUrl;
    });

    // Already small enough — no point recompressing.
    if (img.naturalWidth <= MAX_DIM && file.size < 700 * 1024) {
      return { blob: file, mimeType: file.type || "image/jpeg", bytes: file.size, compressed: false, dataUrl: originalDataUrl };
    }

    const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { error: "Could not prepare the image on this device." };
    ctx.drawImage(img, 0, 0, w, h);

    // JPEG blob for delivery (smallest); PNG only when alpha matters.
    const needsAlpha = /image\/png$/.test(type) || /image\/webp$/.test(type);
    const outMime = needsAlpha ? "image/png" : "image/jpeg";
    const blob = await canvasToBlob(canvas, outMime, JPEG_QUALITY);
    const outDataUrl = canvas.toDataURL(outMime, JPEG_QUALITY);
    return {
      blob,
      mimeType: outMime,
      bytes: blob.size,
      compressed: true,
      dataUrl: outDataUrl,
    };
  } catch {
    // Decode failed (rare) — pass through; the server decides.
    return { blob: file, mimeType: file.type || "image/jpeg", bytes: file.size, compressed: false, dataUrl: originalDataUrl };
  }
}
