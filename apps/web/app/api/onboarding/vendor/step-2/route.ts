import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { mockAuthRepo, mockVendorRepo, mockIdentityRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS3.2 — Vendor Phase A, Step 2: campus & sub-area.
 */
const schema = z.object({
  campus: z.string().min(1, "Choose your campus."),
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
  const { campus, subArea } = parsed.data;

  const vendor = await mockVendorRepo.patch(identity.vendorId, { campus, subArea: subArea ?? null });
  if (!vendor) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });

  // Keep identity campus in sync (single coherent identity).
  await mockIdentityRepo.patch(identity.id, { campus });

  return NextResponse.json({ ok: true, nextStep: 3, vendorId: vendor.id });
}
