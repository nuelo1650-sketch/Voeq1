import { NextRequest, NextResponse } from "next/server";
import { mockFeatureFlagRepo } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/** VS7.19 — Feature flags (config.write). */
export async function GET() {
  try { await requireCapability("config.write"); } catch (e) { if (e instanceof Response) return new NextResponse(null, { status: e.status }); throw e; }
  return NextResponse.json({ ok: true, flags: await mockFeatureFlagRepo.list() }, { status: 200 });
}

// P2 (config console): create a flag. The table starts EMPTY on prod —
// without a create path the Flags panel would have nothing to toggle.
// Key validated as a kebab/dot namespaced token (it becomes an identifier).
export async function POST(req: NextRequest) {
  let actor;
  try { actor = await requireCapability("config.write"); } catch (e) { if (e instanceof Response) return new NextResponse(null, { status: e.status }); throw e; }
  const body = await req.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key.trim().toLowerCase() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!key) return NextResponse.json({ error: "missing_key" }, { status: 400 });
  if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(key)) {
    return NextResponse.json({ error: "invalid_key — use lowercase letters, digits, dots or dashes (e.g. explore.chips-from-db)" }, { status: 400 });
  }
  const value = body.value === true;
  const created = await mockFeatureFlagRepo.set(key, value, description);
  return NextResponse.json({ ok: true, flag: created }, { status: 200 });
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
