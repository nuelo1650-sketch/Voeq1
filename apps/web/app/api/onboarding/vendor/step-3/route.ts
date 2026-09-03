import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  mockAuthRepo,
  mockVendorRepo,
  mockIdentityRepo,
  CURRENT_VENDOR_AGREEMENT_VERSION,
} from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS3.2 — Vendor Phase A, Step 3: Vendor Agreement acceptance.
 * Completes Phase A. Vendor status = 'pending_listings' (NOT public yet).
 * Identity.role stays 'shopper' — it widens to 'vendor' only when canGoLive (Phase B, VS3.6).
 */
const schema = z.object({
  agreed: z.boolean().refine((v) => v === true, { message: "You must accept the Vendor Agreement." }),
});

export async function POST(req: NextRequest) {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!identity.vendorId) return NextResponse.json({ error: "Complete steps 1–2 first." }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const vendor = await mockVendorRepo.patch(identity.vendorId, {
    agreementVersion: CURRENT_VENDOR_AGREEMENT_VERSION,
    agreementAcceptedAt: new Date().toISOString(),
    status: "pending_listings",
  });
  if (!vendor) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });

  // P-A round 66: vendor-created notification. The user signed up as a vendor
  // and finished onboarding — tell them (in-app). Previous behavior: nothing
  // fired, so the bell stayed empty after completing a vendor profile.
  try {
    const { mockNotificationRepo } = await import("@voeq/data");
    await mockNotificationRepo.create({
      recipientId: identity.id,
      type: "system",
      title: "Your vendor profile is ready 🎉",
      body: "Add your first listing to start selling on campus.",
      refId: identity.vendorId ?? null,
    });
  } catch {
    // Non-blocking — notification must never fail onboarding.
  }

  return NextResponse.json({ ok: true, nextStep: "complete", vendorId: vendor.id, status: vendor.status });
}
