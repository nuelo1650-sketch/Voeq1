import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { subjectExport } from "@voeq/db";
import { logAudit, mockAuthRepo } from "@voeq/data";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * Staff batch 2 / T5 (B2-6) — NDPR right of access: GET /api/settings/export-data
 * returns the CALLER'S OWN personal data as a JSON download bundle.
 *
 * Scope decisions (batch-2 plan): JSON, not HTML/PDF — NDPR asks for the data,
 * not a brochure, and Render free tier has no headless-pdf infra. The query
 * assembly lives in packages/db/subject-export.ts (same drizzle-instance rule
 * as admin-cleanup). Exclusions enforced there: passwordHash, OTPs/magic
 * links/pending tokens, and counterparty message bodies.
 */
export async function GET() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = sessionId ? await mockAuthRepo.currentIdentity(sessionId) : null;
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const bundle = await subjectExport(identity.id).catch((e) => {
    console.error("[export-data] subjectExport failed:", e);
    return null;
  });
  if (!bundle) return NextResponse.json({ error: "identity_not_found" }, { status: 404 });

  await logAudit("data.export.self", identity.id, {
    identityId: identity.id,
    counts: { messages: bundle.messages.length, listings: bundle.listings.length },
  });

  const filename = `voeq-data-export-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(bundle, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
