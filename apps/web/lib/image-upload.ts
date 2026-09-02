"use client";

/**
 * P-A round 65 — DIRECT upload client (the fix for the base64 train).
 *
 * Flow: file → /api/images/sign (60s signed token) → browser uploads the FILE
 * bytes directly to Cloudinary (multipart) → returns secure_url → POST
 * /api/images/upload with { url } for server-side moderation + record.
 *
 * The OLD path sent base64 dataUrl through our server to Cloudinary — 3x
 * memory use, 10MB body limit, slow. This path sends the raw file to a CDN;
 * our server never sees more than a URL.
 */

export interface SignedUpload {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
}

export interface UploadOutcome {
  /** false → check reason. true → url/publicId present. */
  ok: boolean;
  url?: string;
  publicId?: string;
  reason?: string;
  retryable?: boolean;
}

/** Narrowed success shape for callers that checked ok. */
export interface UploadSuccess {
  ok: true;
  url: string;
  publicId: string;
}

/** Thin JSON POST helper with a single error string. */
async function postJson<T>(path: string, body: unknown): Promise<{ res: Response; data: T }> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { res, data };
}

/**
 * Upload a File directly to Cloudinary, then moderate/record via our server.
 * Throws on transport failures; returns {ok:false,reason} for deliberate
 * rejection (invalid type/size/moderation) so callers show the reason.
 */
export async function uploadPhoto(
  file: File,
  context: "vendor_photo" | "listing_photo" | "message_attachment",
  opts?: { existingCount?: number },
): Promise<UploadOutcome> {
  // ---- client-side pre-checks (precise errors, no round trip: fail fast) ----
  const KB = 1024;
  const MB = 1024 * KB;
  const type = file.type.toLowerCase();
  if (!/(image\/(jpeg|png|webp|heic|heif))/.test(type)) {
    return { ok: false, reason: "Unsupported format — use JPG, PNG, WebP, or HEIC." };
  }
  if (file.size > 10 * MB) {
    return { ok: false, reason: "Photo is larger than 10MB. Pick a smaller one." };
  }
  if (file.size < 5 * KB) {
    return { ok: false, reason: "Photo is too small. Use a sharper image." };
  }

  // ---- 1) signed token from our server (secret stays server-side) ----
  let signRes: Response;
  let signData: { ok?: boolean; error?: string; sign?: SignedUpload };
  try {
    ({ res: signRes, data: signData } = await postJson<{ ok?: boolean; error?: string; sign?: SignedUpload }>("/api/images/sign", {}));
  } catch {
    return { ok: false, reason: "Network error starting upload. Try again.", retryable: true };
  }
  if (!signRes.ok || !signData.ok || !signData.sign) {
    return { ok: false, reason: signData.error === "upload_unavailable" ? "Upload is unavailable right now. Try again shortly." : "Could not start upload. Try again.", retryable: true };
  }

  // ---- 2) direct upload to Cloudinary (browser → CDN, no server memory) ----
  const { cloudName, apiKey, signature, timestamp, folder } = signData.sign;
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("folder", folder);
  form.append("timestamp", String(timestamp));
  form.append("api_key", apiKey);
  form.append("signature", signature);

  let upRes: Response;
  let upData: { secure_url?: string; public_id?: string; error?: { message?: string } };
  try {
    upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: form,
    });
    upData = await upRes.json().catch(() => ({}));
  } catch {
    return { ok: false, reason: "Upload to photo cloud failed — check your connection.", retryable: true };
  }
  if (!upRes.ok || !upData.secure_url) {
    return { ok: false, reason: upData.error?.message ?? "Upload failed. Try again.", retryable: true };
  }
  const url = upData.secure_url;
  const publicId = upData.public_id ?? "";

  // ---- 3) server moderation + record (authoritative) ----
  let modRes: Response;
  let modData: { ok?: boolean; reason?: string; retryable?: boolean; url?: string };
  try {
    ({ res: modRes, data: modData } = await postJson<{ ok?: boolean; reason?: string; retryable?: boolean; url?: string }>("/api/images/upload", {
      fileName: file.name,
      context,
      mimeType: type,
      bytes: file.size,
      url,
      publicId,
      existingCount: opts?.existingCount,
    }));
  } catch {
    return { ok: false, reason: "Network error verifying photo. Try again.", retryable: true };
  }
  if (!modRes.ok || !modData.ok) {
    return { ok: false, reason: modData.reason ?? "Photo was not approved.", retryable: modData.retryable ?? true };
  }

  return { ok: true, url: modData.url ?? url, publicId };
}

/** Legacy data-URL path for consumers that need it (message attachments). */
export async function uploadPhotoDataUrl(dataUrl: string, fileName: string, context: "vendor_photo" | "listing_photo" | "message_attachment"): Promise<UploadOutcome> {
  try {
    const { res, data } = await postJson<{ ok?: boolean; reason?: string; retryable?: boolean; url?: string }>("/api/images/upload", {
      fileName,
      context,
      dataUrl,
    });
    if (!res.ok || !data.ok) return { ok: false, reason: data.reason ?? "Photo was not approved.", retryable: data.retryable ?? true };
    return { ok: true, url: data.url ?? "", publicId: "" };
  } catch {
    return { ok: false, reason: "Network error uploading photo. Try again.", retryable: true };
  }
}

/** Append Cloudinary delivery transforms + cache-busting version for fast, compressed delivery. */
export function cdnTransform(url: string, width?: number): string {
  if (!/^https:\/\/(res\.)?cloudinary\.com\//.test(url)) return url;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const idx = parts.findIndex((p) => p === "upload");
    if (idx === -1) return url;
    const params: string[] = ["f_auto", "q_auto"];
    if (width) params.push(`w_${width}`);
    parts.splice(idx + 1, 0, params.join(","));
    u.pathname = parts.join("/");
    return u.toString();
  } catch {
    return url;
  }
}
