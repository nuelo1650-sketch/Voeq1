/**
 * MONEY BAG F-4 (D2) — Vercel Cron endpoint: GET /api/cron/nightly
 * Runs the same logic as packages/db/scripts/cron-nightly.mts (shared module)
 * on a schedule. Auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET`;
 * we require it when CRON_SECRET is set (local/dev without the secret passes
 * only outside production).
 */
import { NextRequest, NextResponse } from "next/server";
import { runNightlyCron } from "@voeq/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const isProd = process.env.NODE_ENV === "production";
  const auth = req.headers.get("authorization") ?? "";
  if (secret) {
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (isProd) {
    // prod with no secret configured: refuse (misconfiguration, fail closed)
    return NextResponse.json({ error: "cron_secret_not_configured" }, { status: 500 });
  }

  const result = await runNightlyCron();
  return NextResponse.json({ ok: true, ...result });
}
