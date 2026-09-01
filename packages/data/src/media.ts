/**
 * VS3.3 / D.4 — Cloudinary + Sightengine pipeline (REAL).
 *
 * Phase 9 swap complete: this now performs genuine Cloudinary uploads and
 * Sightengine moderation behind the same `uploadAndModerate` signature the app
 * depends on. No mock in production.
 *
 * Flow:
 *   1. Upload bytes to Cloudinary (unsigned preset) -> secure_url.
 *   2. Moderate that URL with Sightengine (nudity/properties/wad).
 *   3. PASS  -> return the Cloudinary URL.
 *      FAIL  -> delete the Cloudinary asset (don't leave unmoderated public
 *               image) and return a clear, PII-free reason.
 *
 * FAIL-CLOSED (locked requirement): any Sightengine error, timeout, or
 * non-200 response REJECTS the image. We never approve on doubt.
 *
 * Dev fallback: if the Cloudinary/Sightengine secrets are absent (local dev
 * without keys), we degrade to the deterministic mock so the UI still works.
 * In production the secrets are always present (validated by validateEnv),
 * so the real path is enforced.
 */

export interface ModerationResult {
  ok: boolean;
  /** Present when ok === true. */
  url?: string;
  /** Present when ok === false. Never leaks PII. */
  reason?: string;
}

export interface UploadInput {
  fileName: string;
  /** Raw image bytes (preferred). */
  bytes?: number;
  /** base64 data URL (data:image/...;base64,....) — used by the web client. */
  dataUrl?: string;
  mimeType?: string;
  /** Test/override hook to force a decision (dev only; ignored in prod). */
  force?: "pass" | "fail";
}

const MOCK_CLOUDINARY_BASE = "https://res.cloudinary.com/voeq-mock/image/upload";

const NUDITY_THRESHOLD = 0.6; // reject above this combined nudity score

function hasRealProviders(): boolean {
  const seUser = process.env.SIGHTENGINE_API_USER ?? process.env.SIGHTENGINE_USER;
  const seSecret = process.env.SIGHTENGINE_API_SECRET ?? process.env.SIGHTENGINE_SECRET;
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET &&
      seUser &&
      seSecret,
  );
}

/** Resolve Sightengine credentials (supports both SIGHTENGINE_* and SIGHTENGINE_API_* names). */
function sightengineCreds(): { user: string; secret: string } {
  return {
    user: process.env.SIGHTENGINE_API_USER ?? process.env.SIGHTENGINE_USER ?? "",
    secret: process.env.SIGHTENGINE_API_SECRET ?? process.env.SIGHTENGINE_SECRET ?? "",
  };
}

// --- Mock fallback (dev only) ------------------------------------------------

function mockCloudinaryUpload(input: UploadInput): string {
  const slug = input.fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase() || "asset";
  const seed = Math.random().toString(36).slice(2, 8);
  return `${MOCK_CLOUDINARY_BASE}/v1/${slug}-${seed}.jpg`;
}

function mockSightengineModerate(input: UploadInput): ModerationResult {
  const shouldReject =
    input.force === "fail" || /reject|fail|nude|explicit|nsfw/i.test(input.fileName);
  if (shouldReject) {
    return { ok: false, reason: "Image did not pass automated content review." };
  }
  return { ok: true, url: mockCloudinaryUpload(input) };
}

// --- Real Cloudinary upload ------------------------------------------------

async function cloudinaryUpload(input: UploadInput): Promise<{ url: string; publicId: string }> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const file = input.dataUrl ?? "";
  if (!file) throw new Error("no_file");

  const ts = Math.floor(Date.now() / 1000);
  const folder = "voeq";
  // Signed upload: signature over the params (alphabetical, key=value, joined
  // by &) + api secret. No unsigned preset needed.
  const toSign = `folder=${folder}&timestamp=${ts}${apiSecret}`;
  const { createHash } = await import("node:crypto");
  const signature = createHash("sha1").update(toSign).digest("hex");

  const body = new URLSearchParams({
    file,
    folder,
    timestamp: String(ts),
    api_key: apiKey,
    signature,
  });

  const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    signal: AbortSignal.timeout(20_000),
    body,
  });
  if (!r.ok) {
    const errJson = await r.json().catch(() => ({}));
    throw new Error(`cloudinary_http_${r.status}: ${JSON.stringify(errJson).slice(0, 200)}`);
  }
  const json = (await r.json()) as { secure_url?: string; public_id?: string };
  if (!json.secure_url) throw new Error("cloudinary_no_url");
  return { url: json.secure_url, publicId: json.public_id ?? "" };
}

async function cloudinaryDestroy(publicId: string): Promise<void> {
  if (!publicId) return;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const ts = Math.floor(Date.now() / 1000);
  // Unsigned destroy is not allowed; we use the admin API with signature.
  const params = new URLSearchParams({
    public_id: publicId,
    timestamp: String(ts),
  });
  const toSign = `public_id=${publicId}&timestamp=${ts}${process.env.CLOUDINARY_API_SECRET}`;
  const { createHash } = await import("node:crypto");
  const signature = createHash("sha1").update(toSign).digest("hex");
  params.set("api_key", process.env.CLOUDINARY_API_KEY!);
  params.set("signature", signature);
  try {
    await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: params,
    });
  } catch {
    // Best-effort cleanup; ignored.
  }
}

// --- Real Sightengine moderation (fail-closed) -----------------------------

async function sightengineModerate(url: string): Promise<ModerationResult> {
  const { user: seUser, secret: seSecret } = sightengineCreds();
  const params = new URLSearchParams({
    url,
    models: "properties,nudity,wad",
    api_user: seUser ? seUser : (process.env.SIGHTENGINE_API_USER ?? process.env.SIGHTENGINE_USER ?? ""),
    api_secret: seSecret,
  });
  let json: any;
  try {
    const r = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(15_000),
      body: params,
    });
    if (!r.ok) return { ok: false, reason: "Content review unavailable. Please try again." };
    json = await r.json();
  } catch {
    // Network/timeout -> fail closed.
    return { ok: false, reason: "Content review unavailable. Please try again." };
  }

  if (json.status !== "success") {
    return { ok: false, reason: "Content review unavailable. Please try again." };
  }
  const nudity = json.nudity;
  const score =
    (nudity?.raw ?? 0) +
    (nudity?.sexual_activity ?? 0) +
    (nudity?.sexual_display ?? 0) +
    (nudity?.erotica ?? 0);
  if (score > NUDITY_THRESHOLD) {
    return { ok: false, reason: "Image did not pass automated content review." };
  }
  // wad = weapons/alcohol/drugs/recreational_drugs — reject if flagged high.
  const wad = json.wad;
  if (wad && (wad.weapon > 0.5 || wad.alcohol > 0.5 || wad.drugs > 0.5 || wad.recreational_drug > 0.5)) {
    return { ok: false, reason: "Image did not pass automated content review." };
  }
  return { ok: true, url };
}

// --- Public entry point ----------------------------------------------------

export async function uploadAndModerate(input: UploadInput): Promise<ModerationResult> {
  // P-A round 27 (F16 SECURITY/DATA FIX): never silently fall back to MOCK
  // outside dev. The old code returned a fake "voeq-mock" Cloudinary URL when
  // provider secrets were missing — which stored BROKEN images in real rows
  // (the root cause of every 'image not showing' report). In production an
  // upload with missing providers must FAIL LOUD, never fake a URL.
  if (!hasRealProviders()) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: "Upload is unavailable: image providers are not configured." };
    }
    return mockSightengineModerate(input);
  }

  let uploaded: { url: string; publicId: string };
  try {
    uploaded = await cloudinaryUpload(input);
  } catch {
    return { ok: false, reason: "Upload failed. Please try again." };
  }

  const moderation = await sightengineModerate(uploaded.url);
  if (!moderation.ok) {
    // Fail-closed: remove the unmoderated public asset.
    await cloudinaryDestroy(uploaded.publicId);
    return { ok: false, reason: moderation.reason ?? "Image did not pass automated content review." };
  }
  return { ok: true, url: uploaded.url };
}
