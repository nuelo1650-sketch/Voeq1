/**
 * Google OAuth state helper (client-side).
 *
 * The OAuth CSRF `state` must round-trip through Google. We set it as a
 * BROWSER cookie (not a server Set-Cookie behind the Vercel→Render rewrite,
 * which strips Set-Cookie from the upstream response). A browser-set cookie
 * survives the proxy and is readable by the callback route via cookies().
 */
const GOOGLE_STATE_COOKIE = "google_oauth_state";

export function startGoogleOAuth() {
  const state = crypto.randomUUID().replace(/-/g, "") + Date.now().toString(36);
  // Set on the root domain; readable by the callback (same origin voeq.ng).
  document.cookie = `${GOOGLE_STATE_COOKIE}=${state}; path=/; max-age=600; samesite=lax`;
  window.location.href = `/api/auth/google?state=${encodeURIComponent(state)}`;
}
