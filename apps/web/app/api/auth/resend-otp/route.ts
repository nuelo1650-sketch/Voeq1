import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { peekPendingToken, issueOtp, logAudit } from "@voeq/data";
import { sendEmail } from "@voeq/data/server";

const schema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { token } = parsed.data;

  const pending = await peekPendingToken(token);
  if (!pending) {
    return NextResponse.json(
      { error: "This verification link is invalid or has expired. Please sign up again." },
      { status: 400 },
    );
  }

  const code = await issueOtp(pending.email, pending.purpose);
  const sent = await sendEmail({
    to: pending.email,
    template: pending.purpose === "google_verify" ? "OTP_REGISTRATION" : "OTP_REGISTRATION",
    vars: { name: pending.email.split("@")[0], code },
  });
  if (!sent.ok) {
    console.error("[resend-otp] OTP email failed:", sent.error);
    return NextResponse.json(
      { error: "We couldn't send your verification code. Please try again shortly." },
      { status: 502 },
    );
  }
  await logAudit("otp.resent", null, { email: pending.email, purpose: pending.purpose });

  // Same token remains valid for verify; the new OTP code is what changed.
  return NextResponse.json({ ok: true });
}
