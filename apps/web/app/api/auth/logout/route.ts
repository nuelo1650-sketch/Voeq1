import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockSessionRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/** Log out the current session only. */
export async function POST() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await mockSessionRepo.revoke(sessionId);
  }
  const res = NextResponse.json({ ok: true, redirect: "/login" });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
