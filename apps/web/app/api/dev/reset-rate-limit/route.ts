import { NextResponse } from "next/server";
import { rateLimitStore } from "@voeq/data";

/**
 * DEV-ONLY test tool. Clears the in-memory rate-limit store so validation paths
 * and the limit itself can be exercised in isolation. Refuses to run in
 * production (returns 404 before any side effect). Do not mount anywhere else.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  rateLimitStore.clear();

  return NextResponse.json({
    reset: true,
    timestamp: new Date().toISOString(),
    message: "Rate limit store cleared (dev only)",
  });
}
