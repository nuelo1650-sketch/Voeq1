import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { mockAuthRepo, computeVendorAnalytics } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS5.11 — Derived vendor analytics for the dashboard. Counts come from real
 * relationship records (no impression log in VS5). openNow derived from hours.
 * Owner-only.
 */
export async function GET() {
  const store = await cookies();
  const identity = await mockAuthRepo.currentIdentity(store.get(SESSION_COOKIE)?.value ?? null);
  if (!identity || !identity.vendorId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const analytics = await computeVendorAnalytics(identity.vendorId);
  return NextResponse.json({ ok: true, analytics });
}
