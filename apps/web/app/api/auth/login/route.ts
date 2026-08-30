import { NextRequest, NextResponse } from "next/server";
import { verify } from "@node-rs/argon2";
import {
  mockIdentityRepo,
  mockSessionRepo,
  checkRateLimit,
  logAudit,
} from "@voeq/data";
import { z } from "zod";
import { verifyTurnstile } from "@/lib/turnstile";

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 5 / email / 15min

// FIX #4: Added Turnstile bot protection
const schema = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
  password: z.string().min(1),
  remember: z.boolean().optional(),
  next: z.string().optional(),
  intent: z.string().optional(),
  turnstileToken: z.string().min(1, "Bot protection required"),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  const { email, password, remember, next, intent, turnstileToken } = parsed.data;

  // FIX #4: Verify Turnstile first (bot protection before rate-limit check)
  const cfOk = await verifyTurnstile({
    token: turnstileToken,
    clientIp: ip,
    action: "login",
  });
  if (!cfOk.ok) {
    await logAudit("login.failed", null, { reason: "turnstile_failed", email });
    return NextResponse.json({ error: "Bot verification failed. Please try again." }, { status: 403 });
  }

  // Uniform rate-limit keyed by email (anti-enumeration + brute-force).
  const rl = await checkRateLimit(`login:${email}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later or reset your password." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const identity = await mockIdentityRepo.getByEmail(email);

  // Uniform response: never reveal whether the email exists.
  if (!identity || !identity.passwordHash) {
    await logAudit("login.failed", identity?.id ?? null, { reason: "no_identity_or_no_pw" });
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  let ok = false;
  try {
    ok = await verify(identity.passwordHash, password);
  } catch {
    ok = false;
  }
  if (!ok) {
    await logAudit("login.failed", identity.id, { reason: "bad_password" });
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  // Account state gate (Doc 04 PG-AUTH-004 / Doc 09 §9.5).
  if (identity.accountStatus === "suspended") {
    return NextResponse.json({ error: "suspended", redirect: "/account-state?status=suspended" }, { status: 403 });
  }
  if (identity.accountStatus === "banned") {
    return NextResponse.json({ error: "banned", redirect: "/account-state?status=banned" }, { status: 403 });
  }
  if (identity.accountStatus === "deleted") {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  if (identity.accountStatus !== "active") {
    // pending_verification without consent yet -> send to consent flow.
    return NextResponse.json({ error: "inactive", redirect: "/consent" }, { status: 403 });
  }

  const session = await mockSessionRepo.create(identity.id);
  // Remember-me extends to 30d (default already 30d; non-remember could be shorter,
  // but mock phase keeps 30d for both — Phase 9 can shorten non-remember).
  // Phase 1: preserve the user's pending intent so post-auth the action resumes.
  const res = NextResponse.json({ ok: true, redirect: resolveNext(next, intent) });
  res.cookies.set("sessionId", session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });
  await logAudit("login.success", identity.id, {});
  return res;
}

/** Doc 09 §9.16: only same-origin relative paths are allowed as ?next targets. */
function sanitizeNext(next?: string): string {
  if (!next) return roleHome();
  // Reject protocol-relative, absolute, and non-/-starting paths.
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return roleHome();
  }
  // Block path traversal.
  if (next.includes("..")) return roleHome();
  return next;
}

/**
 * Phase 1: sanitize `next`, then re-attach the user's pending `intent` so the
 * post-auth action resumes. If `intent` is present and valid, it's appended to
 * the target; the client reads it via usePendingIntent() and re-triggers.
 */
function resolveNext(next?: string, intent?: string): string {
  const base = sanitizeNext(next);
  if (!intent) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}intent=${encodeURIComponent(intent)}`;
}

function roleHome(): string {
  return "/consent"; // consent gate enforces before app; VS2.7/2.8 route after
}
