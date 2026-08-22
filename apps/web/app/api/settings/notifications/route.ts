import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockUserPrefRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";
import type { NotificationPref } from "@voeq/data";

/**
 * PATCH /api/settings/notifications — update per-type notification prefs.
 * Auth required. Body: { prefs: Record<string, "email" | "in_app" | "none"> }
 * Creates the preference row if absent (a user may reach settings before onboarding
 * has written one).
 */
export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.prefs !== "object" || body.prefs === null) {
    return NextResponse.json({ error: "invalid prefs" }, { status: 400 });
  }

  // Validate every value is a legal NotificationPref.
  const prefs = body.prefs as Record<string, string>;
  for (const v of Object.values(prefs)) {
    if (v !== "email" && v !== "in_app" && v !== "none") {
      return NextResponse.json({ error: "invalid pref value" }, { status: 400 });
    }
  }

  const existing = await mockUserPrefRepo.get(identity.id);
  // save() upserts (creates if absent) and now honors notificationPrefs.
  await mockUserPrefRepo.save({
    identityId: identity.id,
    campus: existing?.campus,
    interestTags: existing?.interestTags,
    feedPrefsSetAt: existing?.feedPrefsSetAt,
    notificationPrefs: prefs as Record<string, NotificationPref>,
  });

  return NextResponse.json({ ok: true, notificationPrefs: prefs });
}
