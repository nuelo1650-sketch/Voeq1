import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { logAudit } from "@voeq/data";

const GOOGLE_STATE_COOKIE = "google_oauth_state";
const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
// Public site origin (voeq.ng) — the browser stays on this domain through the
// whole flow (Vercel proxies /api/* to Render), so the state cookie matches.
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://voeq.ng";

/**
 * VS2.6 — Google OAuth 2.0 initiation (PRODUCTION).
 *
 * Redirects the browser to Google's authorization endpoint with:
 *  - client_id (from AUTH_GOOGLE_CLIENT_ID)
 *  - redirect_uri = ${API_ORIGIN}/api/auth/google/callback (must match the
 *    Authorized redirect URI in Google Cloud Console)
 *  - state (CSRF token, stored in an httpOnly cookie, verified in callback)
 *  - scope = openid email profile
 *
 * Google does NOT bypass consent or OTP (Reversal 5): new Google users still
 * verify via a 6-digit OTP (purpose: google_verify) and accept consent.
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.AUTH_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Google sign-in is not configured." },
      { status: 503 },
    );
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = `${SITE_ORIGIN}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  const res = NextResponse.redirect(`${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`);
  res.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  await logAudit("google.initiate", null, {});
  return res;
}
