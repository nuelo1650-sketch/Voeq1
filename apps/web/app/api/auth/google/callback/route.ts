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
  console.log("[BUG2-TRACE] Google OAuth callback started:", {
    timestamp: new Date().toISOString(),
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });

  const store = await cookies();
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const expectedState = store.get(GOOGLE_STATE_COOKIE)?.value;

  console.log("[BUG2-TRACE] OAuth parameters:", {
    hasCode: !!code,
    codeLength: code?.length || 0,
    state,
    expectedState,
    stateMatches: state === expectedState,
  });

  if (!code || !state || !expectedState || state !== expectedState) {
    console.error("[BUG2-TRACE] State validation failed, redirecting to login");
    return NextResponse.redirect(new URL("/login?error=google_state", req.url));
  }

  // Consume state cookie (single-use).
  const res = NextResponse.next();
  res.cookies.delete(GOOGLE_STATE_COOKIE);

  const clientId = process.env.AUTH_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.AUTH_GOOGLE_CLIENT_SECRET;
  
  console.log("[BUG2-TRACE] Google OAuth config:", {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdLength: clientId?.length || 0,
    siteOrigin: SITE_ORIGIN,
  });

  if (!clientId || !clientSecret) {
    console.error("[BUG2-TRACE] Missing Google OAuth credentials");
    return NextResponse.redirect(new URL("/login?error=google_config", req.url));
  }

  let profile: GoogleProfile;
  try {
    console.log("[BUG2-TRACE] Exchanging code for tokens...");
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
    
    console.log("[BUG2-TRACE] Token exchange response:", {
      status: tokenRes.status,
      ok: tokenRes.ok,
      statusText: tokenRes.statusText,
    });

    if (!tokenRes.ok) {
      const errorBody = await tokenRes.text();
      console.error("[BUG2-TRACE] Token exchange failed:", errorBody);
      return NextResponse.redirect(new URL("/login?error=google_token", req.url));
    }
    const tokens = (await tokenRes.json()) as { access_token?: string };
    
    console.log("[BUG2-TRACE] Tokens received:", {
      hasAccessToken: !!tokens.access_token,
      tokenLength: tokens.access_token?.length || 0,
    });

    if (!tokens.access_token) {
      console.error("[BUG2-TRACE] No access token in response");
      return NextResponse.redirect(new URL("/login?error=google_token", req.url));
    }
    
    console.log("[BUG2-TRACE] Fetching user profile...");
    const infoRes = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    
    console.log("[BUG2-TRACE] Profile fetch response:", {
      status: infoRes.status,
      ok: infoRes.ok,
    });

    if (!infoRes.ok) {
      const errorBody = await infoRes.text();
      console.error("[BUG2-TRACE] Profile fetch failed:", errorBody);
      return NextResponse.redirect(new URL("/login?error=google_profile", req.url));
    }
    profile = (await infoRes.json()) as GoogleProfile;
    
    console.log("[BUG2-TRACE] Profile received:", {
      sub: profile.sub,
      email: profile.email,
      name: profile.name,
      hasPicture: !!profile.picture,
    });
  } catch (err) {
    console.error("[BUG2-TRACE] OAuth network error:", err);
    return NextResponse.redirect(new URL("/login?error=google_network", req.url));
  }

  if (!profile.sub || !profile.email) {
    console.error("[BUG2-TRACE] Invalid profile (missing sub or email)");
    return NextResponse.redirect(new URL("/login?error=google_profile", req.url));
  }

  console.log("[BUG2-TRACE] Checking for existing user with googleSubject:", profile.sub);
  const existing = await mockIdentityRepo.getByGoogleSubject(profile.sub);
  
  console.log("[BUG2-TRACE] Existing user lookup result:", {
    found: !!existing,
    accountStatus: existing?.accountStatus,
    identityId: existing?.id,
  });

  if (existing) {
    console.log("[BUG2-TRACE] Existing user path - checking account status");
    if (existing.accountStatus === "suspended") {
      console.log("[BUG2-TRACE] Account suspended, redirecting");
      return NextResponse.redirect(new URL("/account-state?status=suspended", req.url));
    }
    if (existing.accountStatus === "banned") {
      console.log("[BUG2-TRACE] Account banned, redirecting");
      return NextResponse.redirect(new URL("/account-state?status=banned", req.url));
    }
    
    console.log("[BUG2-TRACE] Creating session for existing user");
    const session = await createSession(existing.id);
    console.log("[BUG2-TRACE] Session created:", { sessionId: session.id });
    
    const r = NextResponse.redirect(new URL("/consent", req.url));
    r.cookies.set("sessionId", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    await logAudit("google.login", existing.id, {});
    console.log("[BUG2-TRACE] Redirecting existing user to /consent");
    return r;
  }

  // New Google user: create pending, verify via OTP (NOT magic link).
  console.log("[BUG2-TRACE] New user path - creating pending identity");
  const identity = await mockIdentityRepo.createPending({
    email: profile.email,
    name: profile.name ?? profile.email.split("@")[0],
    passwordHash: null,
    method: "google",
    intent: null,
    googleSubject: profile.sub,
  });
  
  console.log("[BUG2-TRACE] Pending identity created:", { identityId: identity.id });
  
  const otp = await issueOtp(profile.email, "google_verify");
  console.log("[BUG2-TRACE] OTP issued:", { otpCode: otp });
  
  // Dev helper: log OTP for easy testing
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n🔐 [DEV] Google OTP for ${profile.email}: ${otp}\n`);
  }
  
  const pendingToken = await issuePendingToken(profile.email, "google_verify");
  console.log("[BUG2-TRACE] Pending token issued:", { pendingToken });
  
  console.log("[BUG2-TRACE] Sending OTP email...");
  const emailResult = await sendEmail({
    to: profile.email,
    template: "OTP_REGISTRATION",
    vars: { name: profile.name ?? "", code: otp },
  });
  console.log("[BUG2-TRACE] Email send result:", emailResult);
  
  await logAudit("google.signup", identity.id, {});

  const redirectUrl = new URL(`/verify-otp?token=${pendingToken}&purpose=google_verify`, req.url);
  console.log("[BUG2-TRACE] Redirecting new user to verify-otp:", redirectUrl.toString());
  return NextResponse.redirect(redirectUrl);
}
