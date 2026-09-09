/**
 * Google OAuth state helper (client-side).
 *
 * The OAuth CSRF `state` must round-trip through Google. We set it as a
 * BROWSER cookie (not a server Set-Cookie behind the Vercel→Render rewrite,
 * which strips Set-Cookie from the upstream response). A browser-set cookie
 * survives the proxy and is readable by the callback route via cookies().
 *
 * MONEY BAG F2 (D5, founder: "we don't just let google auth decide for them"):
 * the user's intent (shopper|vendor) rides WITH the state — stored in a
 * separate short-lived cookie AND encoded in the state payload the callback
 * can verify. CSRF stays intact: state random part unchanged, intent is
 * validated against the allowlist, cookie + param must agree.
 */
const GOOGLE_STATE_COOKIE = "google_oauth_state";
const GOOGLE_INTENT_COOKIE = "google_oauth_intent";

export type OAuthIntent = "shopper" | "vendor";

export function startGoogleOAuth(intent?: OAuthIntent) {
  const state = crypto.randomUUID().replace(/-/g, "") + Date.now().toString(36);
  // Set on the root domain; readable by the callback (same origin voeq.ng).
  document.cookie = `${GOOGLE_STATE_COOKIE}=${state}; path=/; max-age=600; samesite=lax`;
  if (intent === "shopper" || intent === "vendor") {
    document.cookie = `${GOOGLE_INTENT_COOKIE}=${intent}; path=/; max-age=600; samesite=lax`;
  } else {
    document.cookie = `${GOOGLE_INTENT_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }
  // Intent also rides in the redirect URL — the callback cross-checks it
  // against the cookie (mismatch = tampering = intent dropped, CSRF intact).
  const intentQs = intent ? `&intent=${intent}` : "";
  window.location.href = `/api/auth/google?state=${encodeURIComponent(state)}${intentQs}`;
}
