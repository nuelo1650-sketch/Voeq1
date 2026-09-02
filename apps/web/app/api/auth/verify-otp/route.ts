import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  mockIdentityRepo,
  mockSessionRepo,
  mockNotificationRepo,
  verifyOtp,
  consumePendingToken,
  peekPendingToken,
  checkRateLimit,
  logAudit,
  sendEmail,
} from "@voeq/data/server";
import { z } from "zod";

const OTP_LIMIT = 5;
const OTP_WINDOW_MS = 15 * 60 * 1000;

const schema = z.object({
  token: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }
  const { token, code } = parsed.data;

  // P-A round 21 (SECURITY FIX): verify the OTP BEFORE consuming the pending
  // token. Previously consumePendingToken ran first — a wrong/expired code
  // destroyed the token, so a typo (or expired code) forced re-signup instead
  // of a retry. Now: wrong code leaves the token + OTP intact for a retry.

  const rl = await checkRateLimit(`otp:${token}`, OTP_LIMIT, OTP_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Request a new code." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  // Find the pending token WITHOUT consuming it (pure read).
  const pending = await peekPendingToken(token);
  if (!pending) {
    return NextResponse.json(
      { error: "This verification link is invalid or has expired. Please sign up again." },
      { status: 400 },
    );
  }

  const ok = await verifyOtp(pending.email, code, pending.purpose);
  if (!ok) {
    return NextResponse.json(
      { error: "Incorrect or expired code. Check the digits and try again." },
      { status: 400 },
    );
  }

  // OTP verified → consume the pending token (authority for activation) and let
  // any failure be impossible at this point (token already validated above).
  await consumePendingToken(token);

  const identity = await mockIdentityRepo.getByEmail(pending.email);
  if (!identity) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  // P3 (2026-08-29): Welcome email goes to accounts verifying for the FIRST time
  // (status was pending_verification). Covers both email registration AND Google
  // first-login (purpose google_verify). An email_change on an active account
  // must NOT re-welcome. Capture before the patch activates it.
  const isFirstVerification = identity.accountStatus === "pending_verification";

  // Activate + mark verified. Consent still required (VS2.7) before app access.
  await mockIdentityRepo.patch(identity.id, {
    accountStatus: "active",
    emailVerified: true,
  });

  const session = await mockSessionRepo.create(identity.id);
  const jar = await cookies();
  jar.set("sessionId", session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });

  await logAudit("signup.verified", identity.id, { method: identity.method });

  // Seed one honest system notification (VS4.8) — welcome, not a fake count.
  await mockNotificationRepo.create({
    recipientId: identity.id,
    type: "system",
    title: "Welcome to Voeq",
    body: "Your account is verified. Explore campus vendors near you.",
  });

  // P3 (2026-08-29): send the WELCOME email on first-ever verification.
  // Covers email registration + Google first-login; skips email_change re-verifies.
  // Fire-and-forget: email failure must never fail verification.
  if (isFirstVerification) {
    void sendEmail({
      to: identity.email,
      template: "WELCOME",
      vars: { name: identity.name || "there" },
    }).then((r) => {
      // P-A round 47: sendEmail returns {ok:false} on failure — the old
      // .catch() only caught REJECTIONS; a returned failure was SILENT, so a
      // broken welcome email looked like "no email sent" with no trace.
      if (!r.ok) {
        console.error(`[welcome] sendEmail FAILED for ${identity.email}: ${r.error}`);
      } else {
        console.log(`[welcome] sent to ${identity.email} (${r.id ?? "dev"})`);
      }
    });
  }

  return NextResponse.json({ ok: true, redirect: "/consent" });
}
