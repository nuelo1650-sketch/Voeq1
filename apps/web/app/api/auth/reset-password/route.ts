import { NextRequest, NextResponse } from "next/server";
import { hash } from "@node-rs/argon2";
import {
  mockIdentityRepo,
  mockMagicLinkRepo,
  mockSessionRepo,
  magicLinkEntries,
  INVALIDATE_SESSIONS_ON_RESET,
  checkRateLimit,
  logAudit,
} from "@voeq/data";
import { z } from "zod";

const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters."),
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
  const { token, password } = parsed.data;

  const rl = await checkRateLimit(`reset-use:${token}`, LIMIT, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Request a new reset link." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const consumed = await mockMagicLinkRepo.consume(token);
  if (!consumed.ok || !consumed.email) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 },
    );
  }
  const email = consumed.email;

  const identity = await mockIdentityRepo.getByEmail(email);
  if (!identity || identity.accountStatus === "deleted") {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  // Invalidate any OTHER outstanding reset tokens for this email (single-use + freshness).
  // consume() already single-used the presented token; the loop below drops any
  // other still-valid tokens so a stale link can't be reused.
  for (const [t, v] of magicLinkEntries()) {
    if (v.email === email && t !== token && !v.used) v.used = true;
  }

  const passwordHash = await hash(password);
  await mockIdentityRepo.patch(identity.id, {
    passwordHash,
    emailVerified: true,
  });

  // Doc 09 §9.5: on reset, revoke ALL sessions by default (const-flippable).
  if (INVALIDATE_SESSIONS_ON_RESET) {
    await mockSessionRepo.revokeAllForIdentity(identity.id);
  }

  await logAudit("reset.completed", identity.id, {});
  // Security notification (Phase 9: Resend). Mocked here.
  console.log(`[mock-email] SECURITY: password reset completed for ${email}`);
  return NextResponse.json({ ok: true, redirect: "/login" });
}
