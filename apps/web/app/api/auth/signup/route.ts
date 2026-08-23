import { NextRequest, NextResponse } from "next/server";
import { hash } from "@node-rs/argon2";
import {
  mockIdentityRepo,
  issueOtp,
  issuePendingToken,
  checkRateLimit,
  logAudit,
  sendEmail,
} from "@voeq/data/server";
import { z } from "zod";
import { verifyTurnstile } from "@/lib/turnstile";

const SIGNUP_LIMIT = 3;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000; // 3 / hour per IP (anti-enumeration + abuse)

const schema = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().trim().min(2, "Enter your name.").max(80),
  intent: z.enum(["shopper", "vendor"]),
  consent: z
    .boolean()
    .refine((v) => v === true, {
      message: "You must accept the Terms and Privacy Policy.",
    }),
  // Cloudflare Turnstile response token (D.6). Required in production.
  turnstileToken: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";

  // D.6 — Bot check BEFORE any work. Fail closed; degrade only when secret unset (dev).
  const raw = await req.text();
  let parsed: ReturnType<typeof schema.safeParse>;
  try {
    const json = JSON.parse(raw);
    parsed = schema.safeParse(json);
    if (parsed.success) {
      const tv = await verifyTurnstile({
        token: parsed.data.turnstileToken,
        clientIp: ip,
        action: "signup",
      });
      if (!tv.ok) {
        return NextResponse.json(
          { error: "Verification failed. Please reload and try again." },
          { status: 403 },
        );
      }
    }
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const rl = await checkRateLimit(`signup:${ip}`, SIGNUP_LIMIT, SIGNUP_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ error: "Validation failed", fieldErrors }, { status: 400 });
  }

  const { email, password, name, intent } = parsed.data;

  // Anti-enumeration: uniform response for existing email.
  const existing = await mockIdentityRepo.getByEmail(email);
  if (existing) {
    if (existing.accountStatus === "deleted") {
      return NextResponse.json(
        { error: "This email cannot be used." },
        { status: 409 },
      );
    }
    // Pretend success; do not reveal the account exists.
    return NextResponse.json({
      pendingToken: await issuePendingToken(email, "registration"),
      purpose: "registration",
    });
  }

  const passwordHash = await hash(password);
  const identity = await mockIdentityRepo.createPending({
    email,
    name,
    passwordHash,
    method: "email",
    intent,
  });

  const code = await issueOtp(email, "registration");
  // D.5 — Real email via Resend (dev fallback logs when RESEND_API_KEY unset).
  await sendEmail({ to: email, template: "OTP_REGISTRATION", vars: { name, code } });

  const pendingToken = await issuePendingToken(email, "registration");
  await logAudit("signup.initiated", identity.id, { method: "email", intent });

  return NextResponse.json({ pendingToken, purpose: "registration" });
}
