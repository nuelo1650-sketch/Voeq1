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
 *
 * P-A round 65: the app's NEW path is uploadAndModerateByUrl — the browser
 * uploads the file DIRECTLY to Cloudinary (signed token), this module only
 * moderates the URL + cleans up on rejection. The base64 dataUrl path remains
 * for legacy/mock/tests.
 */
import type { ImageContext } from "./interfaces";

export interface ModerationResult {
  ok: boolean;
  /** Present when ok === true. */
  url?: string;
  /** Present when ok === false. Never leaks PII. */
  reason?: string;
  /** Present when ok === false and the failure is transient (retryable). */
  retryable?: boolean;
}

export interface UploadInput {
  fileName: string;
  /** Raw image bytes (preferred). */
  bytes?: number;
  /** b64 data URL (data:image/...;base64,....) — used by the web client. */
  dataUrl?: string;
  mimeType?: string;
  /** Test/override hook to force a decision (dev only; ignored in prod). */
  force?: "pass" | "fail";
  /** Image context (used by the by-url moderation path for audit/cap). */
  context?: ImageContext;
}

const MOCK_CLOUDINARY_BASE = "https://res.cloudinary.com/voeq-mock/image/upload";

const NUDITY_THRESHOLD = 0.6; // reject above this combined nudity score

function hasRealProviders(): boolean {
  const seUser = process.env.SIGHTENGINE_API_USER ?? process.env.SIGHTENGINE_USER;
  const seSecret = process.env.SIGHTENGINE_API_SECRET ?? process.env.SIGHTENGINE_SECRET;
  // P-A round 57 (C12): accept the NEXT_PUBLIC_ alias too — env.ts already
  // validates it as a fallback, but media.ts ONLY read the CLOUDINARY_CLOUD_NAME
  // form, so a deploy that validated "ok" could still hard-fail uploads.
  const cloud = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return Boolean(
    cloud &&
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
  // P-A round 57 (C12): alias-aware cloud name (see hasRealProviders).
  const cloud = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
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
    // P-A round 56: log the REAL status/body so diagnosis isn't blind. The old
    // code mapped every non-200 to "Content review unavailable" — meaningless.
    if (!r.ok) {
      const bodyText = await r.text().catch(() => "");
      console.error(`[sightengine] HTTP ${r.status} for ${url}: ${bodyText.slice(0, 300)}`);
      return { ok: false, reason: "Content review unavailable. Please try again.", retryable: r.status >= 500 };
    }
    json = await r.json();
  } catch (e) {
    // Network/timeout -> fail closed.
    console.error(`[sightengine] fetch failed for ${url}: ${e instanceof Error ? e.message : String(e)}`);
    return { ok: false, reason: "Content review unavailable. Please try again.", retryable: true };
  }

  if (json.status !== "success") {
    return { ok: false, reason: "Content review unavailable. Please try again.", retryable: true };
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
  } catch (e) {
    // P-A round 56: the old catch threw away the reason (e.g. Cloudinary 400
    // "Could not decode base64") — diagnosis was blind. Log the real error.
    console.error(`[cloudinary] upload failed: ${e instanceof Error ? e.message : String(e)}`);
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

/**
 * P-A round 65 — DIRECT upload moderation path.
 * The file is already on Cloudinary (uploaded by the browser with a signed
 * token from /api/images/sign). This only moderates the URL and (on failure)
 * removes the asset, so a rejected photo never stays orphaned on the CDN.
 */
export async function uploadAndModerateByUrl(input: UploadInput & { url: string; publicId?: string }): Promise<ModerationResult> {
  const url = input.url;
  if (!/^https:\/\/(res\.)?cloudinary\.com\//.test(url)) {
    return { ok: false, reason: "Only Cloudinary-hosted photos are allowed." };
  }

  const moderation = await sightengineModerate(url);
  if (!moderation.ok) {
    // Fail-closed: delete the orphaned asset before rejecting.
    if (input.publicId) await cloudinaryDestroy(input.publicId).catch(() => {});
    return { ok: false, reason: moderation.reason ?? "Image did not pass automated content review.", retryable: moderation.retryable };
  }
  return { ok: true, url };
}
