import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockVendorRepo, logAudit } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * VS5.2 — Edit storefront business identity (name, description, primary category,
 * sub-area). Owner-only (vendor owns the vendorId resolved from the session).
 * description min 50 chars enforced (Doc 08 §8.4). Audit-logged, PII-free (§9.16).
 */
export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = await mockAuthRepo.currentIdentity(sessionId);
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!identity.vendorId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    if (body.name.trim().length < 2) return NextResponse.json({ error: "name_min_2" }, { status: 400 });
    patch.name = body.name.trim();
  }
  if (typeof body.description === "string") {
    if (body.description.trim().length < 50) return NextResponse.json({ error: "description_min_50" }, { status: 400 });
    patch.description = body.description.trim();
  }
  if (typeof body.primaryCategoryId === "string" && body.primaryCategoryId.length > 0) {
    patch.categoryIds = [body.primaryCategoryId];
  }
  if (body.subArea !== undefined) {
    patch.subArea = typeof body.subArea === "string" && body.subArea.trim().length > 0 ? body.subArea.trim() : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const vendor = await mockVendorRepo.patch(identity.vendorId, patch as never);
  if (!vendor) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await logAudit("vendor.identity.update", identity.id, { fields: Object.keys(patch) });

  return NextResponse.json({ ok: true, vendor });
}
