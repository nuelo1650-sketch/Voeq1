import { NextRequest, NextResponse } from "next/server";
import { peekOtp } from "@voeq/data";
import { realOtpRepo } from "@voeq/db";
import { z } from "zod";

/**
 * DEV-ONLY test tool. Reveals the current OTP for an email+purpose so an
 * automated flow can drive signup -> verify without scraping server logs.
 * Refuses to run in production (404 before any side effect).
 *
 * 2026-08-29: real-DB fallback. peekOtp only reads the in-memory store, but in
 * real mode (DATABASE_URL set) OTPs live in the Neon `otps` table — the sweep
 * harness got `code:null` and every downstream flow failed. Now: in-memory
 * first, then realOtpRepo.peek() (typed inside @voeq/db where drizzle resolves
 * consistently).
 */
const schema = z.object({
  email: z.string().email(),
  purpose: z.enum(["registration", "google_verify", "email_change"]).default("registration"),
});

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { email, purpose } = parsed.data;

  let code = peekOtp(email, purpose);

  if (!code && process.env.DATABASE_URL) {
    try {
      code = await realOtpRepo.peek(email, purpose);
    } catch {
      code = null; // DB not reachable — honest null
    }
  }

  return NextResponse.json({ code: code ?? null });
}
