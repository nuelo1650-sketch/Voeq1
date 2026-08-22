import { NextResponse } from "next/server";
import { runRetentionPasses } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * VS7.24 — Run retention/cleanup passes (config.write). Returns a report of what
 * was pruned/flagged. No fabricated counts.
 */
export async function POST() {
  try { await requireCapability("config.write"); } catch (e) { if (e instanceof Response) return new NextResponse(null, { status: e.status }); throw e; }
  const report = await runRetentionPasses();
  return NextResponse.json({ ok: true, report }, { status: 200 });
}
