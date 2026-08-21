import { NextRequest, NextResponse } from "next/server";
import { mockIdentityRepo, mockMagicLinkRepo, checkRateLimit, logAudit } from "@voeq/data";
import { z } from "zod";

const LIMIT = 3;
const WINDOW_MS = 15 * 60 * 1000; // 3 / email / 15min

const schema = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
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
    // Uniform: do not reveal invalid email format beyond a soft message.
    return NextResponse.json({ ok: true });
  }
  const email = parsed.data.email;

  // Anti-enumeration: rate-limit per email, but ALWAYS return 200.
  const rl = await checkRateLimit(`reset:${email}`, LIMIT, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json({ ok: true });
  }

  const identity = await mockIdentityRepo.getByEmail(email);
  if (identity && identity.accountStatus !== "deleted") {
    const token = await mockMagicLinkRepo.issue(email);
    // Mock delivery (Phase 9: Resend password-reset template, Doc 13 §13.7).
    console.log(`[mock-email] RESET magic-link token ${token} for ${email}`);
    await logAudit("reset.requested", identity.id, {});
  }
  // Always 200 — never confirm/deny account existence.
  return NextResponse.json({ ok: true });
}
