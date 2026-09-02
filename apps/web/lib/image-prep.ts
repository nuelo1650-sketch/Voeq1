"use client";

/**
 * Image preparation helpers — P-A round 56.
 *
 * WHY: Android/iOS gallery photos are 4-12MB. The upload pipeline caps
 * vendor_photo at 5MB, so raw phone photos were ALWAYS rejected with
 * "File exceeds the maximum allowed size" — then the client's error read
 * mismatch scrapped the reason → "Photo upload failed." (the user's bug).
 *
 * Solution: compress client-side BEFORE hitting the API. Downscale to
 * maxDim (1600) + re-encode as JPEG q0.82 — a 7MB photo becomes ~300-600KB.
 * Also: HEIC photos (iPhone) can't be canvas-decoded by most browsers —
 * fall back to the original file so the server gives a clear reason.
 */

export interface PreparedImage {
  dataUrl: string;
  bytes: number;
  mimeType: string;
  /** True when the image was actually compressed (vs passed through). */
  compressed: boolean;
}

const MAX_DIM = 1600;
const JPEG_QUALITY = 0.82;

function isImageType(file: File): boolean {
  return /^image\//.test(file.type) || /\.(jpe?g|png|webp|gif|avif|heic)$/i.test(file.name);
}

/**
 * Prepare an image for the /api/images/upload endpoint.
 * Returns null with a reason if the file can't be handled.
 */
export async function prepareImageForUpload(file: File): Promise<PreparedImage | { error: string }> {
  if (!isImageType(file)) {
    return { error: "Unsupported image type. Use JPEG, PNG or WebP." };
  }

  const originalDataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read_failed"));
    r.readAsDataURL(file);
  });

  // HEIC/HEIF: browsers can't draw these to canvas reliably — send as-is so
  // the server's format guard gives a precise reason, not a silent blank.
  if (/\.heic$/i.test(file.name) || /image\/heic/i.test(file.type)) {
    return {
      dataUrl: originalDataUrl,
      bytes: file.size,
      mimeType: file.type || "image/jpeg",
      compressed: false,
    };
  }

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("decode_failed"));
      i.src = originalDataUrl;
    });

    const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
    // Already small enough — don't degrade quality pointlessly.
    if (scale === 1 && file.size < 700 * 1024) {
      return {
        dataUrl: originalDataUrl,
        bytes: file.size,
        mimeType: file.type || "image/jpeg",
        compressed: false,
      };
    }

    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { error: "Could not prepare the image on this device." };
    ctx.drawImage(img, 0, 0, w, h);

    // JPEG gives the smallest payload; PNG only when alpha/wireframe matters.
    const out = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    const outBytes = Math.round(((out.split(",")[1] ?? "").length * 3) / 4);
    return {
      dataUrl: out,
      bytes: outBytes,
      mimeType: "image/jpeg",
      compressed: true,
    };
  } catch {
    // Decode failed (rare) — pass through; the server decides.
    return {
      dataUrl: originalDataUrl,
      bytes: file.size,
      mimeType: file.type || "image/jpeg",
      compressed: false,
    };
  }
}
