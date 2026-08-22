import { NextRequest, NextResponse } from "next/server";
import { mockFeatureFlagRepo } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/** VS7.19 — Feature flags (config.write). */
export async function GET() {
  try { await requireCapability("config.write"); } catch (e) { if (e instanceof Response) return new NextResponse(null, { status: e.status }); throw e; }
  return NextResponse.json({ ok: true, flags: await mockFeatureFlagRepo.list() }, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  let actor;
  try { actor = await requireCapability("config.write"); } catch (e) { if (e instanceof Response) return new NextResponse(null, { status: e.status }); throw e; }
  const body = await req.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key.trim() : "";
  const value = body.value === true;
  if (!key) return NextResponse.json({ error: "missing_key" }, { status: 400 });
  const updated = await mockFeatureFlagRepo.set(key, value);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, flag: updated }, { status: 200 });
}
