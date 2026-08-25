import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockUserPrefRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS3.1 — return the current identity's UserPreference (interestTags etc).
 * Used by the shopper onboarding page to show the existing selection on revisit.
 * 401 if not authenticated; 200 with the preference (or empty tags) otherwise.
 */
export async function GET() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const prefs = await mockUserPrefRepo.get(identity.id);
  return NextResponse.json({
    interestTags: prefs?.interestTags ?? [],
    feedPrefsSetAt: prefs?.feedPrefsSetAt ?? null,
    campus: prefs?.campus ?? identity.campus ?? null,
  });
}
