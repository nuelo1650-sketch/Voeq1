import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * P-A round 65 — Signed DIRECT upload (the fix for the base64 train).
 *
 * WHY: previously the browser sent a giant base64 dataUrl to /api/images/upload,
 * which re-encoded it and re-posted to Cloudinary — 3x memory, ~10MB body
 * limits, slow. Now: this route returns a SHORT-LIVED (60s) signed upload
 * token (folder + timestamp + sha1 signature using the server-side secret).
 * The browser uploads the FILE DIRECTLY to Cloudinary; the secret never
 * leaves the server; our server only moderates the resulting URL.
 *
 * The signature covers the exact params Cloudinary will hash (empty params
 * for the signature per Cloudinary rules: the signature itself is excluded).
 */
export async function POST(_req: NextRequest) {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const cloud = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
  const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
  if (!cloud || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "upload_unavailable" }, { status: 503 });
  }

  const ts = Math.floor(Date.now() / 1000);
  const folder = "voeq";
  const toSign = `folder=${folder}&timestamp=${ts}${apiSecret}`;
  const { createHash } = await import("node:crypto");
  const sig = createHash("sha1").update(toSign).digest("hex");

  return NextResponse.json({
    ok: true,
    sign: {
      cloudName: cloud,
      apiKey,
      signature: sig,
      timestamp: ts,
      folder,
    },
  });
}
