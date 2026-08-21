import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, acceptConsent } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS2.7 / VS3.1 — record consent acceptance (server-authoritative).
 * Google does NOT bypass this (Reversal 5). Doc 09 §9.4/§9.22.
 */
export async function POST(req: NextRequest) {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  await acceptConsent(identity.id, identity.method);
  return NextResponse.json({ ok: true, redirect: "/select-campus" });
}
