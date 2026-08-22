import { NextResponse } from "next/server";
import { computePlatformAnalytics } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/** VS7.12 — Platform analytics (admin/super_admin). All counts derived, no fake metrics. */
export async function GET() {
  let actor;
  try {
    actor = await requireCapability("analytics.read");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }
  const analytics = await computePlatformAnalytics();
  return NextResponse.json({ ok: true, analytics, viewer: actor.staffRole }, { status: 200 });
}
