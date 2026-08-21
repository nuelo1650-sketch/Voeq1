import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockSessionRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/** Log out ALL sessions for the current identity (Doc 09 §9.5 / security hygiene). */
export async function POST() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    const id = await mockSessionRepo.get(sessionId);
    if (id) await mockSessionRepo.revokeAllForIdentity(id.identityId);
  }
  const res = NextResponse.json({ ok: true, redirect: "/login" });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
