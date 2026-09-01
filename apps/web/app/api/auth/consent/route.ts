import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, acceptConsent } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";
import { sanitizeNext } from "@/lib/postAuth";

/**
 * VS2.7 / VS3.1 — record consent acceptance (server-authoritative).
 * Google does NOT bypass this (Reversal 5). Doc 09 §9.4/§9.22.
 *
 * Phase 1: honor ?next (and ?intent) so a user who landed here mid-flow resumes
 * their original action instead of being dumped at /select-campus. This is the
 * consent half of the post-auth intent queue.
 */
export async function POST(req: NextRequest) {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  await acceptConsent(identity.id, identity.method);

  // P-A round 7 (A2): role-aware post-consent routing. Previously EVERYONE
  // (vendors included) went to /select-campus -> /onboarding/shopper -> /home,
  // which made a vendor who'd completed onboarding land in the SHOPPER flow
  // and dashboard. Vendor identities keep their route.
  const url = new URL(req.url);
  const next = sanitizeNext(url.searchParams.get("next") ?? undefined, identity.vendorId ? "/vendor/dashboard" : "/select-campus");
  const intent = url.searchParams.get("intent") ?? "";
  const sep = next.includes("?") ? "&" : "?";
  const redirect = intent ? `${next}${sep}intent=${encodeURIComponent(intent)}` : next;
  return NextResponse.json({ ok: true, redirect });
}
