import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { mockAuthRepo, mockVendorRepo, mockIdentityRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS3.2 — Vendor Phase A, Step 1: business identity (name, description, primary category).
 * Creates the Vendor record (status pending_listings) and links it to the Identity.
 */
const schema = z.object({
  name: z.string().trim().min(2, "Business name is required."),
  description: z.string().trim().min(50, "Description must be at least 50 characters."),
  categoryId: z.string().min(1, "Choose a category."),
});

export async function POST(req: NextRequest) {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { name, description, categoryId } = parsed.data;

  // Create or reuse the vendor linked to this identity.
  let vendor = identity.vendorId ? await mockVendorRepo.getById(identity.vendorId) : null;
  if (!vendor) {
    vendor = await mockVendorRepo.create({
      identityId: identity.id,
      name,
      campus: identity.campus ?? "nmu",
      categoryIds: [categoryId],
      description,
      status: "pending_listings",
    });
    await mockIdentityRepo.patch(identity.id, { vendorId: vendor.id });
  } else {
    await mockVendorRepo.patch(vendor.id, { name, description, categoryIds: [categoryId] });
  }

  return NextResponse.json({ ok: true, nextStep: 2, vendorId: vendor.id });
}
