import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockUserPrefRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS3.1 — persist shopper feed preferences + stamp feedPrefsSetAt.
 * Requires authenticated identity. Skipping (empty tags) still sets the gate
 * so the user isn't bounced back here. (Doc 08 §8.3)
 */
export async function POST(req: NextRequest) {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { interestTags?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const raw = Array.isArray(body.interestTags) ? body.interestTags : [];
  const interestTags = raw.filter((t): t is string => typeof t === "string");

  await mockUserPrefRepo.save({
    identityId: identity.id,
    campus: identity.campus ?? undefined,
    interestTags,
    feedPrefsSetAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, redirect: "/home" });
}
