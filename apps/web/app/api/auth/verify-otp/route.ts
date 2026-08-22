import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  mockIdentityRepo,
  mockSessionRepo,
  mockNotificationRepo,
  verifyOtp,
  consumePendingToken,
  checkRateLimit,
  logAudit,
} from "@voeq/data";
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

  const pending = consumePendingToken(token);
  if (!pending) {
    return NextResponse.json(
      { error: "This verification link is invalid or has expired. Please sign up again." },
      { status: 400 },
    );
  }

  const rl = await checkRateLimit(`otp:${pending.email}`, OTP_LIMIT, OTP_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Request a new code." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const ok = await verifyOtp(pending.email, code, pending.purpose);
  if (!ok) {
    return NextResponse.json(
      { error: "Incorrect or expired code. Check the digits and try again." },
      { status: 400 },
    );
  }

  const identity = await mockIdentityRepo.getByEmail(pending.email);
  if (!identity) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

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

  return NextResponse.json({ ok: true, redirect: "/consent" });
}
