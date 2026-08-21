import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import {
  mockIdentityRepo,
  issueOtp,
  issuePendingToken,
  logAudit,
} from "@voeq/data";

const GOOGLE_STATE_COOKIE = "google_oauth_state";

/**
 * VS2.6 — Google OAuth initiation (DEV MOCK).
 *
 * Production (Phase 9): redirect to accounts.google.com with a PKCE/state
 * flow. Here we mock: generate CSRF state, store it in an httpOnly cookie,
 * then self-redirect to the callback with a mock code. The callback does the
 * real resolution logic against a mocked profile.
 *
 * Google does NOT bypass consent or OTP (Reversal 5). New Google users still
 * verify via a 6-digit OTP (purpose: google_verify) and accept consent.
 */
export async function GET(req: NextRequest) {
  const state = randomBytes(16).toString("hex");
  const url = new URL("/api/auth/google/callback", req.url);
  url.searchParams.set("code", "mock-dev-code");
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url);
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
