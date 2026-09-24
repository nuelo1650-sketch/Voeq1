import { NextRequest, NextResponse } from "next/server";
import { mockCategoryRepo } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * VS7.16 — Category CRUD (config.write).
 * ADMIN-09: + reorder action (swap sort_order of two categories).
 */
export async function GET() {
  try { await requireCapability("config.write"); } catch (e) { if (e instanceof Response) return new NextResponse(null, { status: e.status }); throw e; }
  const categories = await mockCategoryRepo.list();
  // ADMIN-09: sort by sortOrder, "other" slug always last.
  const sorted = [...categories].sort((a, b) => {
    const aOther = a.slug === "other" ? 1 : 0;
    const bOther = b.slug === "other" ? 1 : 0;
    if (aOther !== bOther) return aOther - bOther;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
  return NextResponse.json({ ok: true, categories: sorted }, { status: 200 });
}

export async function POST(req: NextRequest) {
  let actor;
  try { actor = await requireCapability("config.write"); } catch (e) { if (e instanceof Response) return new NextResponse(null, { status: e.status }); throw e; }
  const body = await req.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!slug || !name) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  const created = await mockCategoryRepo.create({ slug, name });
  return NextResponse.json({ ok: true, category: created }, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  let actor;
  try { actor = await requireCapability("config.write"); } catch (e) { if (e instanceof Response) return new NextResponse(null, { status: e.status }); throw e; }
  const body = await req.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!slug) return NextResponse.json({ error: "missing_slug" }, { status: 400 });

  // P2 (config console): rename action — display name only, slug is the
  // stable key (listings reference category ids, not names).
  if (body.action === "rename") {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    const renamed = await mockCategoryRepo.rename(slug, name);
    if (!renamed) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, category: renamed }, { status: 200 });
  }

  // ADMIN-09: reorder action — swap sort_order with an adjacent category.
  if (body.action === "reorder") {
    const slugB = typeof body.slugB === "string" ? body.slugB.trim() : "";
    if (!slugB) return NextResponse.json({ error: "missing_slugB" }, { status: 400 });
    const updated = await mockCategoryRepo.reorder(slug, slugB);
    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, categories: updated }, { status: 200 });
  }

  const isActive = body.isActive === true;
  const updated = await mockCategoryRepo.setActive(slug, isActive);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, category: updated }, { status: 200 });
}
