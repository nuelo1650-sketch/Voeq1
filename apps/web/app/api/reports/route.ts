import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockReportRepo, mockListingsRepo, mockVendorRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";
import type { ReportCategory } from "@voeq/data";

/**
 * POST /api/reports — create a real staff case (status open). Auth required.
 * Cannot report your own listing/vendor (400). Doc 13 §13.x moderation queue.
 */
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const targetType = body?.targetType;
  const targetId = body?.targetId;
  const category = body?.category as ReportCategory | undefined;
  const text = typeof body?.body === "string" ? body.body.trim() : null;

  const VALID_CATEGORIES: ReportCategory[] = [
    "not_on_campus",
    "scam",
    "inappropriate",
    "impersonation",
    "harassment",
    "other",
  ];

  if (targetType !== "listing" && targetType !== "vendor") {
    return NextResponse.json({ error: "invalid targetType" }, { status: 400 });
  }
  if (typeof targetId !== "string" || !targetId) {
    return NextResponse.json({ error: "invalid targetId" }, { status: 400 });
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "invalid category" }, { status: 400 });
  }

  // IDOR/self-report guard: cannot report your own item.
  if (targetType === "listing") {
    const listing = await mockListingsRepo.getById(targetId);
    if (!listing) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const vendor = await mockVendorRepo.getById(listing.vendorId);
    if (vendor?.identityId && vendor.identityId === identity.id) {
      return NextResponse.json({ error: "cannot_report_self" }, { status: 400 });
    }
  } else {
    const vendor = await mockVendorRepo.getById(targetId);
    if (!vendor) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (vendor.identityId && vendor.identityId === identity.id) {
      return NextResponse.json({ error: "cannot_report_self" }, { status: 400 });
    }
  }

  const report = await mockReportRepo.create({
    reporterId: identity.id,
    targetType,
    targetId,
    category,
    body: text,
  });
  return NextResponse.json({ ok: true, reportId: report.id });
}
