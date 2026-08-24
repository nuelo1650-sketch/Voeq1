import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { logAudit } from "@voeq/data";

const GOOGLE_STATE_COOKIE = "google_oauth_state";
const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
// Public site origin (voeq.ng) — the browser stays on this domain through the
// whole flow (Vercel proxies /api/* to Render), so the state cookie matches.
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://voeq.ng";
// Public OAuth client ID. This is a non-secret, publicly-visible value (it
// appears in the browser's redirect URL and Google Cloud Console). Provided as
// a fallback so initiation works on platforms (e.g. Vercel) that may not carry
// the env var; the real secret is only used in the callback (Render).
const FALLBACK_GOOGLE_CLIENT_ID =
  "296084254850-0v864trsdv6mvl0erc0p0c88e5t72mae.apps.googleusercontent.com";

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
  const clientId = process.env.AUTH_GOOGLE_CLIENT_ID || FALLBACK_GOOGLE_CLIENT_ID;
  // State is generated + set as a browser cookie by the client (lib/googleOAuth.ts)
  // so it survives the Vercel→Render rewrite (which strips upstream Set-Cookie).
  const state = req.nextUrl.searchParams.get("state") || randomBytes(16).toString("hex");
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
  // NOTE: the google_oauth_state cookie is set by the client (lib/googleOAuth.ts)
  // before navigating here, so it survives the Vercel→Render rewrite.
  await logAudit("google.initiate", null, {});
  return res;
}
