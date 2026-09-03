import { NextRequest, NextResponse } from "next/server";
import {
  mockIdentityRepo,
  mockStaffRepo,
  logAudit,
  verifyAppealToken,
  checkRateLimit,
  clientIpFrom,
  notifyStaff,
} from "@voeq/data";

/**
 * Staff batch 2 / T7 — appeal intake. THE only unauthenticated mutating
 * endpoint in the app, so the token design carries the whole trust model:
 *
 *  - The link (/appeal?t=...) was minted server-side for one (identityId,
 *    email) pair. Submitting requires re-typing the email; the HMAC check
 *    proves the pair matches WITHOUT the server ever trusting a claimed id.
 *  - Invalid/tampered token -> generic 400 invalid_token. We never reveal
 *    whether an identity exists (no enumeration oracle on banned accounts).
 *  - Rate-limited per IP (5/15min) — it is unauthenticated.
 *  - One OPEN appeal per identity: re-submitting amends the pending appeal
 *    (payload.history keeps prior messages) instead of spamming the queue.
 *  - Creates a staff case (queue "appeals") + notifyStaff alert + audit.
 *    Staff resolve via the Appeals tab (T8), which can reinstate on resolve.
 */
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = clientIpFrom(req.headers.get("x-forwarded-for"));
  const rl = await checkRateLimit(`appeal:${ip ?? "unknown"}`, 5, 15 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "too_many_attempts", retryAfterMs: rl.retryAfterMs }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!token || !email) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  if (message.length < 10) {
    return NextResponse.json(
      { error: "message_too_short", hint: "Tell us at least a sentence about why this is a mistake." },
      { status: 400 },
    );
  }
  if (message.length > 2000) return NextResponse.json({ error: "message_too_long" }, { status: 400 });

  const identityId = verifyAppealToken(token, email);
  if (!identityId) {
    // Same shape for tampered, wrong-email, or unknown identity — no oracle.
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const identity = await mockIdentityRepo.getById(identityId);
  if (!identity) return NextResponse.json({ error: "invalid_token" }, { status: 400 });

  // Dedupe: one open appeal per identity (open or triaged both count).
  const all = await mockStaffRepo.listCases("appeals");
  const pending = all.find(
    (c) => (c.status === "open" || c.status === "triaged") && c.payload?.identityId === identity.id,
  );

  const now = new Date().toISOString();
  let caseId: string;
  let updated = false;

  if (pending) {
    // Amend the pending appeal in place: keep history, refresh the latest message.
    const prevMessages = Array.isArray(pending.payload?.history) ? (pending.payload.history as unknown[]) : [];
    const prevMessage = typeof pending.payload?.message === "string" ? pending.payload.message : "";
    const history = prevMessage ? [...prevMessages, { message: prevMessage, at: pending.payload?.submittedAt ?? null }] : prevMessages;
    await mockStaffRepo.patchCasePayload(pending.id, {
      message: message.slice(0, 2000),
      submittedAt: now,
      history: history.slice(-5), // bounded: last 5 amendments
    });
    caseId = pending.id;
    updated = true;
  } else {
    const c = await mockStaffRepo.create({
      queue: "appeals",
      decision: null,
      consequence: null,
      payload: {
        identityId: identity.id,
        email: identity.email,
        accountStatus: identity.accountStatus,
        message: message.slice(0, 2000),
        submittedAt: now,
        source: "appeal_link",
      },
      createdAt: now,
    });
    caseId = c.id;
    await notifyStaff("new_appeal", { refId: c.id });
  }

  await logAudit("appeal.submitted", identity.id, { caseId, updated, adminAction: true });
  return NextResponse.json({ ok: true, updated }, { status: 200 });
}
