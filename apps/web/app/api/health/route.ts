import { NextResponse } from "next/server";
import { getDb } from "@voeq/db";

/**
 * D.9 — Liveness + readiness probe.
 * Returns 200 only when the app boots AND the database is reachable.
 * Used by Render's health check and an external UptimeRobot ping.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  let dbOk = false;
  let dbError: string | null = null;
  if (db) {
    try {
      await db.execute("select 1");
      dbOk = true;
    } catch (e) {
      dbError = e instanceof Error ? e.message : String(e);
    }
  } else {
    dbError = "DATABASE_URL not set (mock mode) — DB marked degraded";
  }

  const healthy = dbOk;
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      db: dbOk ? "up" : "down",
      dbError,
      time: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
