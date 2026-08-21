import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockVendorRepo, uploadAndModerate } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS3.4 — Profile photo upload (Phase B, step 1 of 2).
 * Mock media pipeline (Cloudinary + Sightengine). Rejected images return 422.
 */
export async function POST(req: NextRequest) {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!identity.vendorId) return NextResponse.json({ error: "No vendor account." }, { status: 400 });

  let body: { fileName?: string; force?: "pass" | "fail" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.fileName) return NextResponse.json({ error: "fileName is required." }, { status: 400 });

  const result = await uploadAndModerate({ fileName: body.fileName, force: body.force });
  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? "Upload rejected." }, { status: 422 });
  }

  const vendor = await mockVendorRepo.patch(identity.vendorId, { profilePhotoUrl: result.url! });
  if (!vendor) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });

  return NextResponse.json({ ok: true, profilePhotoUrl: vendor.profilePhotoUrl });
}
