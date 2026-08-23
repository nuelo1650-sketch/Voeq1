import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  mockIdentityRepo,
  mockSessionRepo,
  issueOtp,
  issuePendingToken,
  createSession,
  logAudit,
  sendEmail,
} from "@voeq/data";

const GOOGLE_STATE_COOKIE = "google_oauth_state";

// Dev-only mock Google profile (Phase 9: real token exchange).
const MOCK_GOOGLE_PROFILE = {
  sub: "mock-sub-123",
  email: "test@gmail.com",
  name: "Mock Google User",
};

/**
 * VS2.6 — Google OAuth callback (DEV MOCK).
 * Verifies CSRF state, resolves the (mocked) profile, then:
 *  - existing Google identity -> create session, go to consent
 *  - new Google identity -> createPending, issue OTP (google_verify), issue
 *    pending token, route to /verify-otp?purpose=google_verify
 */
export async function GET(req: NextRequest) {
  const store = await cookies();
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const expectedState = store.get(GOOGLE_STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.json({ error: "Invalid OAuth state." }, { status: 400 });
  }

  // Consume state cookie (single-use).
  const res = NextResponse.next();
  res.cookies.delete(GOOGLE_STATE_COOKIE);

  const profile = MOCK_GOOGLE_PROFILE;
  const existing = await mockIdentityRepo.getByGoogleSubject(profile.sub);

  if (existing) {
    if (existing.accountStatus === "suspended") {
      return NextResponse.redirect(new URL("/account-state?status=suspended", req.url));
    }
    if (existing.accountStatus === "banned") {
      return NextResponse.redirect(new URL("/account-state?status=banned", req.url));
    }
    const session = await createSession(existing.id);
    const r = NextResponse.redirect(new URL("/consent", req.url));
    r.cookies.set("sessionId", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    await logAudit("google.login", existing.id, {});
    return r;
  }

  // New Google user: create pending, verify via OTP (NOT magic link).
  const identity = await mockIdentityRepo.createPending({
    email: profile.email,
    name: profile.name,
    passwordHash: null,
    method: "google",
    intent: null,
    googleSubject: profile.sub,
  });
  const otp = await issueOtp(profile.email, "google_verify");
  const pendingToken = await issuePendingToken(profile.email, "google_verify");
  // D.5 — Real email via Resend (dev fallback logs when RESEND_API_KEY unset).
  await sendEmail({ to: profile.email, template: "OTP_REGISTRATION", vars: { name: profile.name ?? "" , code: otp } });
  await logAudit("google.signup", identity.id, {});

  const r = NextResponse.redirect(
    new URL(`/verify-otp?token=${pendingToken}&purpose=google_verify`, req.url),
  );
  return r;
}
