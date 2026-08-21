import { NextRequest, NextResponse } from "next/server";
import { peekOtp } from "@voeq/data";
import { z } from "zod";

/**
 * DEV-ONLY test tool. Reveals the current OTP for an email+purpose so an
 * automated flow can drive signup -> verify without scraping server logs.
 * Refuses to run in production (404 before any side effect).
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
  const code = peekOtp(parsed.data.email, parsed.data.purpose);
  return NextResponse.json({ code: code ?? null });
}
