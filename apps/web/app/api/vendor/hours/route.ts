import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockVendorRepo, logAudit } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type Day = (typeof DAYS)[number];

function isValidHHMM(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

/**
 * VS5.3 — Set operating hours. Owner-only. Stored as Vendor.hours.
 * Honest: if unset, "Open now" is NOT shown (no fake always-open).
 */
export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!identity.vendorId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "invalid body" }, { status: 400 });

  if (typeof body.open !== "string" || typeof body.close !== "string" || !isValidHHMM(body.open) || !isValidHHMM(body.close)) {
    return NextResponse.json({ error: "invalid_time" }, { status: 400 });
  }
  if (!Array.isArray(body.days) || body.days.length === 0 || body.days.some((d: unknown) => typeof d !== "string" || !DAYS.includes(d as Day))) {
    return NextResponse.json({ error: "invalid_days" }, { status: 400 });
  }

  const vendor = await mockVendorRepo.patch(identity.vendorId, {
    hours: { open: body.open, close: body.close, days: body.days as Day[] },
  } as never);
  if (!vendor) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await logAudit("vendor.hours.update", identity.id, { hours: `${body.open}-${body.close}` });
  return NextResponse.json({ ok: true, hours: vendor.hours });
}
