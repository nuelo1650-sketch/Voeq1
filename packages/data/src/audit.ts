/**
 * Audit log.
 *
 * P-A round 59 (found while building analytics): the audit trail was
 * IN-MEMORY — an array on the server process. Every `logAudit` call died with
 * the process: deployed events (reports, consents, admin actions) vanished on
 * restart, and the staff Audit Log showed nothing in production.
 * `realAuditStore` (DB-backed, append-only) already existed in @voeq/db but
 * was wired to NOTHING. Now: same factory rule as every other repo —
 * DATABASE_URL present → DB-backed; else in-memory (dev/test).
 *
 * HARD RULE (Doc 09 §9.16): metadata MUST NOT contain PII — no email, name,
 * phone, or raw tokens. Reference identities by `identityId` only.
 */
import { randomUUID } from "crypto";
import type { AuditEntry } from "./interfaces";
import { realAuditStore } from "@voeq/db";

const USE_REAL = !!process.env.DATABASE_URL;

const memoryLog: AuditEntry[] = [];

export async function logAudit(
  type: string,
  identityId: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const entry: AuditEntry = {
    id: randomUUID(),
    type,
    identityId,
    metadata,
    at: new Date().toISOString(),
  };
  if (USE_REAL) {
    await realAuditStore.log({ type, identityId, metadata, adminAction: false });
    return;
  }
  memoryLog.push(entry);
}

export async function queryAudit(filter?: {
  type?: string;
  identityId?: string;
  limit?: number;
}): Promise<AuditEntry[]> {
  if (USE_REAL) {
    return realAuditStore.query(filter);
  }
  let out = memoryLog;
  if (filter?.type) out = out.filter((e) => e.type === filter.type);
  if (filter?.identityId) out = out.filter((e) => e.identityId === filter.identityId);
  out = [...out].sort((a, b) => (a.at < b.at ? 1 : -1));
  if (filter?.limit) out = out.slice(0, filter.limit);
  return out;
}

/** Dev/test-only: clear the audit log between harness assertions. Not imported by any prod path. */
export function resetAudit(): void {
  memoryLog.length = 0;
}
