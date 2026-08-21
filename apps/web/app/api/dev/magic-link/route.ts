import { NextRequest, NextResponse } from "next/server";
import { peekMagicLink } from "@voeq/data";

/**
 * DEV-ONLY test tool. Reveals the most recent reset magic-link token for an
 * email so an automated flow can drive forgot -> reset without scraping logs.
 * Refuses to run in production (404 before any side effect).
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  const { email } = await req.json().catch(() => ({ email: "" }));
  if (!email) return NextResponse.json({ token: null });
  const token = peekMagicLink(email);
  return NextResponse.json({ token: token ?? null });
}
