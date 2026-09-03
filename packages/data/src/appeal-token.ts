/**
 * Staff batch 2 / T6 — appeal tokens.
 *
 * Every enforcement notification promises "appeal by email" — until batch 2
 * that was a mailto black hole. The appeal link (/appeal?t=<token>) makes the
 * promise real: a stateless HMAC token bound to (identityId, email) so the
 * intake endpoint can verify WHO is appealing WITHOUT confirming the account
 * exists to anyone who lacks a valid token (scope-doc governance rule).
 *
 * Design:
 *  - token = base64url(identityId) + "." + base64url(hmac(identityId|email))
 *  - secret = VOEQ_SESSION_SECRET (already required in every env; no new
 *    secret to provision). Domain-separated with a prefix so a session secret
 *    can never be replayed as an appeal verifier or vice versa.
 *  - email is NOT embedded (keeps tokens short and avoids leaking the address
 *    in URLs/history); intake requires the appellant to re-type the email and
 *    the HMAC check proves it matches the identity the token was minted for.
 *  - no expiry: an appeal link for a banned account is useless once the case
 *    is resolved (intake checks case state), and the token is bound to the
 *    identity+email pair. Revoke path = staff resolve/dismiss.
 */
import { createHmac, timingSafeEqual } from "crypto";

const HMAC_SCOPE = "voeq-appeal-v1:";

function secret(): string {
  const s = process.env.VOEQ_SESSION_SECRET ?? "";
  if (!s) throw new Error("appeal_token_requires_VOEQ_SESSION_SECRET");
  return s;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function sign(identityId: string, email: string): Buffer {
  return createHmac("sha256", secret()).update(`${HMAC_SCOPE}${identityId}|${email.toLowerCase().trim()}`).digest();
}

/** Mint an appeal token for (identityId, email). */
export function mintAppealToken(identityId: string, email: string): string {
  return `${b64url(Buffer.from(identityId, "utf8"))}.${b64url(sign(identityId, email))}`;
}

/**
 * Verify a token against a claimed email. Returns the identityId on success,
 * null on any mismatch (bad format, wrong email, tampered signature).
 * Constant-time comparison; never reveals WHICH part failed.
 */
export function verifyAppealToken(token: string, claimedEmail: string): string | null {
  if (!token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  let identityId: string;
  let given: Buffer;
  try {
    identityId = Buffer.from(token.slice(0, dot), "base64url").toString("utf8");
    given = Buffer.from(token.slice(dot + 1), "base64url");
  } catch {
    return null;
  }
  if (!identityId || identityId.length > 64) return null;
  const expected = sign(identityId, claimedEmail);
  if (given.length !== expected.length) return null;
  if (!timingSafeEqual(given, expected)) return null;
  return identityId;
}

/** Public base URL for building the appeal link (falls back to voeq.ng). */
export function appealLink(identityId: string, email: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://voeq.ng").replace(/\/+$/, "");
  return `${base}/appeal?t=${encodeURIComponent(mintAppealToken(identityId, email))}`;
}
