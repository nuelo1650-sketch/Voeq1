import { NextRequest, NextResponse } from "next/server";
import { mockAgreementRepo } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/** VS7.18 — Agreement management (config.write). */
export async function GET(req: NextRequest) {
  try { await requireCapability("config.write"); } catch (e) { if (e instanceof Response) return new NextResponse(null, { status: e.status }); throw e; }
  const kind = req.nextUrl.searchParams.get("kind") as "terms" | "privacy" | "vendor" | null;
  return NextResponse.json({ ok: true, agreements: await mockAgreementRepo.list(kind ?? undefined) }, { status: 200 });
}

export async function POST(req: NextRequest) {
  let actor;
  try { actor = await requireCapability("config.write"); } catch (e) { if (e instanceof Response) return new NextResponse(null, { status: e.status }); throw e; }
  const body = await req.json().catch(() => ({}));
  const kind = typeof body.kind === "string" ? (body.kind as "terms" | "privacy" | "vendor") : "";
  const version = typeof body.version === "string" ? body.version.trim() : "";
  const agreementBody = typeof body.body === "string" ? body.body : "";
  if (!kind || !version || !agreementBody) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  const created = await mockAgreementRepo.create({ kind, version, body: agreementBody });
  return NextResponse.json({ ok: true, agreement: created }, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  let actor;
  try { actor = await requireCapability("config.write"); } catch (e) { if (e instanceof Response) return new NextResponse(null, { status: e.status }); throw e; }
  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  const updated = await mockAgreementRepo.setCurrent(id);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, agreement: updated }, { status: 200 });
}
