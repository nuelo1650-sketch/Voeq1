/**
 * Audit log (mock phase). Stores server-side security/consent events.
 *
 * HARD RULE (Doc 09 §9.16): metadata MUST NOT contain PII — no email, name,
 * phone, or raw tokens. Reference identities by `identityId` only.
 *
 * Phase 9: swap for a real append-only store (DB/queue) — same signature.
 */
import { randomUUID } from "crypto";
import type { AuditEntry } from "./interfaces";

const log: AuditEntry[] = [];

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
  log.push(entry);
}

export async function queryAudit(filter?: {
  type?: string;
  identityId?: string;
  limit?: number;
}): Promise<AuditEntry[]> {
  let out = log;
  if (filter?.type) out = out.filter((e) => e.type === filter.type);
  if (filter?.identityId) out = out.filter((e) => e.identityId === filter.identityId);
  out = [...out].sort((a, b) => (a.at < b.at ? 1 : -1));
  if (filter?.limit) out = out.slice(0, filter.limit);
  return out;
}

/** Dev/test-only: clear the audit log between harness assertions. Not imported by any prod path. */
export function resetAudit(): void {
  log.length = 0;
}
