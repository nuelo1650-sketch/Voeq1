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
  isConsentCurrent,
  recordAuthEvent,
  clientIpFrom,
} from "@voeq/data/server";
import { roleHomeFor } from "@/lib/postAuth";

const GOOGLE_STATE_COOKIE = "google_oauth_state";
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://voeq.ng";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

interface GoogleProfile {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

/**
 * VS2.6 — Google OAuth callback (PRODUCTION).
 *
 * 1. Verify CSRF state cookie matches the `state` param.
 * 2. Exchange `code` for tokens at oauth2.googleapis.com/token.
 * 3. Fetch the user profile from openidconnect.googleapis.com/v1/userinfo.
 * 4. Resolve identity by googleSubject:
 *    - existing -> create session, go to /consent (unless suspended/banned)
 *    - new -> createPending (method google), issue OTP (google_verify),
 *      route to /verify-otp
 */
export async function GET(req: NextRequest) {
  const store = await cookies();
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const expectedState = store.get(GOOGLE_STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?error=google_state", req.url));
  }

  // Consume state cookie (single-use).
  const res = NextResponse.next();
  res.cookies.delete(GOOGLE_STATE_COOKIE);

  const clientId = process.env.AUTH_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.AUTH_GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=google_config", req.url));
  }

  let profile: GoogleProfile;
  try {
    const tokenRes = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${SITE_ORIGIN}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL("/login?error=google_token", req.url));
    }
    const tokens = (await tokenRes.json()) as { access_token?: string };

    if (!tokens.access_token) {
      return NextResponse.redirect(new URL("/login?error=google_token", req.url));
    }

    const infoRes = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!infoRes.ok) {
      return NextResponse.redirect(new URL("/login?error=google_profile", req.url));
    }
    profile = (await infoRes.json()) as GoogleProfile;
  } catch {
    return NextResponse.redirect(new URL("/login?error=google_network", req.url));
  }

  if (!profile.sub || !profile.email) {
    return NextResponse.redirect(new URL("/login?error=google_profile", req.url));
  }

  const existing = await mockIdentityRepo.getByGoogleSubject(profile.sub);

  if (existing) {
    if (existing.accountStatus === "suspended") {
      return NextResponse.redirect(new URL("/account-state?status=suspended", req.url));
    }
    if (existing.accountStatus === "banned") {
      return NextResponse.redirect(new URL("/account-state?status=banned", req.url));
    }

    const session = await createSession(existing.id);
    // P-A round 67 (FIX — 'always accept policies at login'): existing users
    // were ALWAYS redirected to /consent even though consent is recorded
    // server-side. Only re-ask when the acceptance is missing or the policy
    // version has changed (isConsentCurrent). This removes the wall that
    // forced re-agreement on EVERY Google login.
    const consentOk = await isConsentCurrent(existing.id).catch(() => false);
    // P-A round 81: consentOk users land on THEIR app (staff -> /staff,
    // vendor -> /vendor/dashboard, else /home), not the marketing landing.
    const land = consentOk ? roleHomeFor(existing) : "/consent";
    const r = NextResponse.redirect(new URL(land, req.url));
    r.cookies.set("sessionId", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    await logAudit("google.login", existing.id, { consentOk });
    await recordAuthEvent({ identityId: existing.id, event: "google_login", email: existing.email, ip: clientIpFrom(req.headers.get("x-forwarded-for")), userAgent: req.headers.get("user-agent") });
    return r;
  }

  // P-A round 36 (FIX — 'repeated OTPs on Google login'): if the google subject
  // isn't linked BUT an identity with this email already exists (email-first
  // signup), LINK googleSubject to it instead of creating a duplicate pending
  // identity + sending ANOTHER OTP every login. Previously the fall-through
  // created a second identity and re-OTP'd every time.
  const byEmail = await mockIdentityRepo.getByEmail(profile.email);
  if (byEmail) {
    if (byEmail.accountStatus === "suspended" || byEmail.accountStatus === "banned") {
      await logAudit("google.login-email-denied", byEmail.id, { status: byEmail.accountStatus });
      await recordAuthEvent({ identityId: byEmail.id, event: "login_failed", email: byEmail.email, ip: clientIpFrom(req.headers.get("x-forwarded-for")), userAgent: req.headers.get("user-agent") });
      return NextResponse.redirect(new URL("/account-denied?reason=" + byEmail.accountStatus, req.url));
    }
    // Link the Google subject to the existing identity (idempotent).
    await mockIdentityRepo.patch(byEmail.id, { googleSubject: profile.sub });
    await logAudit("google.login-linked", byEmail.id, {});
    await recordAuthEvent({ identityId: byEmail.id, event: "google_login", email: byEmail.email, ip: clientIpFrom(req.headers.get("x-forwarded-for")), userAgent: req.headers.get("user-agent") });
    const session = await createSession(byEmail.id);
    // P-A round 67: linked accounts skip /consent when their acceptance is
    // current (same fix as the existing-user branch — no re-agreement wall).
    const consentOk = await isConsentCurrent(byEmail.id).catch(() => false);
    // P-A round 81: role-aware landing (was staff->/admin, everyone->/).
    const dest = consentOk ? roleHomeFor(byEmail) : "/consent";
    const redirectUrl = new URL(dest, req.url);
    if (!consentOk) {
      redirectUrl.searchParams.set("next", roleHomeFor(byEmail));
      redirectUrl.searchParams.set("session", session.id);
    }
    // Auth status + session cookie for the linked account.
    if (session) {
      const jar = await cookies();
      jar.set("sessionId", session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(session.expiresAt),
      });
    }
    return NextResponse.redirect(redirectUrl);
  }

  // New Google user: create pending, verify via OTP (NOT magic link).
  const identity = await mockIdentityRepo.createPending({
    email: profile.email,
    name: profile.name ?? profile.email.split("@")[0],
    passwordHash: null,
    method: "google",
    intent: null,
    googleSubject: profile.sub,
  });

  const otp = await issueOtp(profile.email, "google_verify");

  // Dev helper: log OTP for easy testing
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n🔐 [DEV] Google OTP for ${profile.email}: ${otp}\n`);
  }

  const pendingToken = await issuePendingToken(profile.email, "google_verify");

  await sendEmail({
    to: profile.email,
    template: "OTP_REGISTRATION",
    vars: { name: profile.name ?? "", code: otp },
  });

  await logAudit("google.signup", identity.id, {});
  await recordAuthEvent({ identityId: identity.id, event: "signup", email: profile.email, ip: clientIpFrom(req.headers.get("x-forwarded-for")), userAgent: req.headers.get("user-agent") });

  const redirectUrl = new URL(`/verify-otp?token=${pendingToken}&purpose=google_verify`, req.url);
  return NextResponse.redirect(redirectUrl);
}
