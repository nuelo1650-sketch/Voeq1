import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { mockAuthRepo, mockVendorRepo, mockIdentityRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS3.2 — Vendor Phase A, Step 2: campus & sub-area.
 */
const schema = z.object({
  campus: z.string().min(1).optional(),
  areaId: z.string().min(1).optional(),
  subArea: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!identity.vendorId) return NextResponse.json({ error: "Complete step 1 first." }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { campus, areaId, subArea } = parsed.data;

  // ONBOARD-03: validate that at least one of campus or areaId is provided
  if (!campus && !areaId) {
    return NextResponse.json({ error: "Choose your campus or area." }, { status: 400 });
  }

  // Update vendor: set campus OR area_id (not both)
  const vendor = await mockVendorRepo.patch(identity.vendorId, { 
    campus: campus ?? null as unknown as string, 
    areaId: areaId ?? null as unknown as string,
    subArea: subArea ?? null 
  });
  if (!vendor) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });

  // Keep identity campus in sync when campus is set
  if (campus) {
    await mockIdentityRepo.patch(identity.id, { campus });
  }

  return NextResponse.json({ ok: true, nextStep: 3, vendorId: vendor.id });
}
