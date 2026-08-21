import { NextRequest, NextResponse } from "next/server";
import { hash } from "@node-rs/argon2";
import {
  mockIdentityRepo,
  issueOtp,
  issuePendingToken,
  checkRateLimit,
  logAudit,
} from "@voeq/data";
import { z } from "zod";

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
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const rl = await checkRateLimit(`signup:${ip}`, SIGNUP_LIMIT, SIGNUP_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
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
  // Mock email delivery (Phase 9: Resend adapter, Doc 13 §13.7).
  console.log(`[mock-email] OTP ${code} for ${email} (registration)`);

  const pendingToken = await issuePendingToken(email, "registration");
  await logAudit("signup.initiated", identity.id, { method: "email", intent });

  return NextResponse.json({ pendingToken, purpose: "registration" });
}
