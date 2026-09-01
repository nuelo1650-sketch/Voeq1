/**
 * Cloudflare Turnstile — canonical server-side siteverify (D.6).
 *
 * Existing-widget flow: the widget is already created (sitekey
 * 0x4AAAAAAEZcnQcg6AZ2SqFM). This module performs the server-side check that
 * the signup handler calls BEFORE creating an account.
 *
 * Security contract (per Cloudflare docs):
 *   - require success === true
 *   - require result.action === expectedAction (binds the token to signup)
 *   - require result.hostname ∈ approved allowlist (stops token reuse cross-host)
 *
 * Graceful degrade: if TURNSTILE_SECRET_KEY is unset, verification is SKIPPED
 * (dev/local). In production the secret is always set, so verification is
 * enforced. This matches the project's "degrade, don't block, when the secret
 * is absent" stance — but note: absence in prod is a misconfig, caught by
 * validateEnv (TURNSTILE_SECRET_KEY is in API_REQUIRED).
 */
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerifyOptions {
  token: unknown;
  clientIp?: string;
  action: string;
}

function approvedHostnames(): Set<string> {
  const fromEnv = (process.env.TURNSTILE_HOSTNAMES ?? process.env.CORS_ALLOWLIST ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean)
    // P-A round 21 (SECURITY FIX): strip URL schemes/paths. CORS_ALLOWLIST
    // holds values like "https://voeq.ng" but Cloudflare reports a BARE
    // hostname ("voeq.ng") in result.hostname — so the allowlist never matched
    // and legits Turnstile checks failed / were inconsistent. Normalize both.
    .map((h) => {
      try {
        const u = new URL(h.includes("://") ? h : `https://${h}`);
        return u.hostname.toLowerCase();
      } catch {
        return h.toLowerCase().split("/")[0];
      }
    });
  // Always allow local dev hosts (never include these in a prod allowlist).
  return new Set([...fromEnv, "localhost", "127.0.0.1"]);
}

export interface TurnstileResult {
  ok: boolean;
  skipped: boolean;
  reason?: string;
}

export async function verifyTurnstile(opts: TurnstileVerifyOptions): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Dev bypass: no secret configured.
  if (!secret) {
    // eslint-disable-next-line no-console
    console.warn("[turnstile] TURNSTILE_SECRET_KEY unset — skipping verification (dev mode).");
    return { ok: true, skipped: true };
  }

  const token = opts.token;
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return { ok: false, skipped: false, reason: "missing-or-malformed-token" };
  }

  let result: { success: boolean; action?: string; hostname?: string; "error-codes"?: string[] };
  try {
    const r = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({
        secret,
        response: token,
        ...(opts.clientIp ? { remoteip: opts.clientIp } : {}),
      }),
    });
    if (!r.ok) return { ok: false, skipped: false, reason: `siteverify-http-${r.status}` };
    result = (await r.json()) as typeof result;
  } catch {
    // Network/timeout to Cloudflare: fail closed (reject), never let a bot through.
    return { ok: false, skipped: false, reason: "siteverify-unreachable" };
  }

  if (!result.success) {
    return { ok: false, skipped: false, reason: `failure:${result["error-codes"]?.join(",") ?? "unknown"}` };
  }
  if (result.action !== opts.action) {
    return { ok: false, skipped: false, reason: `action-mismatch:expected=${opts.action},got=${result.action}` };
  }
  if (!approvedHostnames().has(result.hostname ?? "")) {
    return { ok: false, skipped: false, reason: `hostname-not-allowed:${result.hostname}` };
  }

  return { ok: true, skipped: false };
}
