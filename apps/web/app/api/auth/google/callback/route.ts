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
} from "@voeq/data/server";

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

  // P-A round 36 (FIX — 'repeated OTPs on Google login'): if the google subject
  // isn't linked BUT an identity with this email already exists (email-first
  // signup), LINK googleSubject to it instead of creating a duplicate pending
  // identity + sending ANOTHER OTP every login. Previously the fall-through
  // created a second identity and re-OTP'd every time.
  const byEmail = await mockIdentityRepo.getByEmail(profile.email);
  if (byEmail) {
    if (byEmail.accountStatus === "suspended" || byEmail.accountStatus === "banned") {
      await logAudit("google.login-email-denied", byEmail.id, { status: byEmail.accountStatus });
      return NextResponse.redirect(new URL("/account-denied?reason=" + byEmail.accountStatus, req.url));
    }
    // Link the Google subject to the existing identity (idempotent).
    await mockIdentityRepo.patch(byEmail.id, { googleSubject: profile.sub });
    await logAudit("google.login-linked", byEmail.id, {});
    const session = await createSession(byEmail.id);
    const redirectUrl = new URL("/consent", req.url);
    // P-A round 65b: staff identities continue to /admin, not the landing page.
    redirectUrl.searchParams.set("next", byEmail.staffRole ? "/admin" : "/");
    redirectUrl.searchParams.set("session", session.id);
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

  const redirectUrl = new URL(`/verify-otp?token=${pendingToken}&purpose=google_verify`, req.url);
  return NextResponse.redirect(redirectUrl);
}
