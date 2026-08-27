import { NextRequest, NextResponse } from "next/server";
import { mockCampusRepo } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/** VS7.17 — Campus CRUD + verify/promote (config.write). */
export async function GET() {
  try { await requireCapability("config.write"); } catch (e) { if (e instanceof Response) return new NextResponse(null, { status: e.status }); throw e; }
  return NextResponse.json({ ok: true, campuses: await mockCampusRepo.list() }, { status: 200 });
}

export async function POST(req: NextRequest) {
  let actor;
  try { actor = await requireCapability("config.write"); } catch (e) { if (e instanceof Response) return new NextResponse(null, { status: e.status }); throw e; }
  const body = await req.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!slug || !name) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  const created = await mockCampusRepo.create({ slug, name });
  return NextResponse.json({ ok: true, campus: created }, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  let actor;
  try { actor = await requireCapability("config.write"); } catch (e) { if (e instanceof Response) return new NextResponse(null, { status: e.status }); throw e; }
  const body = await req.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const action = typeof body.action === "string" ? body.action : "";
  if (!slug) return NextResponse.json({ error: "missing_slug" }, { status: 400 });
  let updated = null;
  if (action === "verify") updated = await mockCampusRepo.setStatus(slug, "verified", actor.id);
  else if (action === "unverify") updated = await mockCampusRepo.setStatus(slug, "unverified", actor.id);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, campus: updated }, { status: 200 });
}
