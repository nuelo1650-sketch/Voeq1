/**
 * VS3.3 — Cloudinary + Sightengine MOCK pipeline.
 *
 * No real network calls. Deterministic so BOTH the approved and rejected paths
 * are exercisable in E2E without a live provider:
 *   - a filename containing a reject token ("reject"/"fail"/"nude"/"explicit")
 *     OR `force: "fail"` => moderation rejected.
 *   - otherwise => approved, returns a mock Cloudinary URL.
 *
 * Phase 9 swaps these for the real Cloudinary upload + Sightengine check behind
 * the same signatures. The app routes depend only on `uploadAndModerate`.
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
  bytes?: number;
  /** Test/override hook to force a decision. */
  force?: "pass" | "fail";
}

const MOCK_CLOUDINARY_BASE = "https://res.cloudinary.com/voeq-mock/image/upload";

/** Mock Cloudinary upload — returns a deterministic-looking public URL. */
export function mockCloudinaryUpload(input: UploadInput): string {
  const slug = input.fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase() || "asset";
  const seed = Math.random().toString(36).slice(2, 8);
  return `${MOCK_CLOUDINARY_BASE}/v1/${slug}-${seed}.jpg`;
}

/** Mock Sightengine moderation decision. */
export function mockSightengineModerate(input: UploadInput): ModerationResult {
  const shouldReject =
    input.force === "fail" || /reject|fail|nude|explicit|nsfw/i.test(input.fileName);
  if (shouldReject) {
    return { ok: false, reason: "Image did not pass automated content review." };
  }
  return { ok: true, url: mockCloudinaryUpload(input) };
}

/** Single entry point the app uses. Async for Phase 9 swap-in parity. */
export async function uploadAndModerate(input: UploadInput): Promise<ModerationResult> {
  return mockSightengineModerate(input);
}
