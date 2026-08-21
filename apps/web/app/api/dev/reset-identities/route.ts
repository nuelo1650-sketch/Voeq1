import { NextResponse } from "next/server";
import { resetAuthState } from "@voeq/data";

/**
 * DEV-ONLY test tool. Wipes ALL in-memory identity/session/otp/magic-link stores
 * so a flow that depends on a "fresh" identity (e.g. Google new-user path) can
 * be exercised deterministically. Refuses in production (404 before side effect).
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  resetAuthState();
  return NextResponse.json({ reset: true, scope: "auth", timestamp: new Date().toISOString() });
}
