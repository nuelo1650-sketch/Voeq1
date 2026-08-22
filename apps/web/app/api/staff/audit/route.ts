import { NextRequest, NextResponse } from "next/server";
import { queryAudit, type AuditEntry } from "@voeq/data";
import { requireCapability } from "@/lib/session";

/**
 * VS7.13 — Audit log viewer. requireCapability('audit.read'). Supports type/identity
 * filters + optional adminAction-only filter (post-filtered from query results).
 */
export async function GET(req: NextRequest) {
  let actor;
  try {
    actor = await requireCapability("audit.read");
  } catch (e) {
    if (e instanceof Response) return new NextResponse(null, { status: e.status });
    throw e;
  }
  const type = req.nextUrl.searchParams.get("type") ?? undefined;
  const identityId = req.nextUrl.searchParams.get("identityId") ?? undefined;
  const adminOnly = req.nextUrl.searchParams.get("adminAction") === "1";
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "100");

  let entries = await queryAudit({ type: type ?? undefined, identityId: identityId ?? undefined, limit });
  if (adminOnly) entries = entries.filter((e: AuditEntry) => e.adminAction);
  entries.sort((a: AuditEntry, b: AuditEntry) => b.at.localeCompare(a.at));
  return NextResponse.json({ ok: true, entries: entries.slice(0, limit) }, { status: 200 });
}
