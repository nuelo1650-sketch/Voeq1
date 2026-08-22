/**
 * VS7.24 — Retention / cleanup passes. Runs the periodic maintenance the brief
 * asked for: expired credentials, orphaned staff cases, unverified campuses.
 *
 * NOTE: "soft-deleted vendors/listings >30d" is intentionally NOT implemented here
 * because the current model has no soft-delete field (Vendor.status / Listing.status
 * are the lifecycle enums). Faking a soft-delete store would be dishonest — this
 * pass is a no-op placeholder that documents the real Phase 9 cleanup target.
 */
import { pruneExpiredCredentials } from "./auth";
import { mockStaffRepo } from "./mock";
import { mockCampusRepo } from "./config";

export interface RetentionReport {
  prunedCredentials: number;
  resolvedStaffCases: number;
  unverifiedCampuses: string[];
  softDeletedStubsRemoved: number; // Phase 9 target (currently 0 — no soft-delete model)
}

/** Run all retention passes. `now` injectable for tests. */
export async function runRetentionPasses(now: number = Date.now()): Promise<RetentionReport> {
  const prunedCredentials = pruneExpiredCredentials(now);

  // Orphaned staff cases: resolved/dismissed are eligible for purge (Phase 9 prunes them).
  const cases = await mockStaffRepo.listCases("");
  const resolvedStaffCases = cases.filter((c) => c.status === "resolved" || c.status === "dismissed").length;

  const campuses = await mockCampusRepo.list();
  const unverifiedCampuses = campuses.filter((c) => c.status === "unverified").map((c) => c.id);

  return {
    prunedCredentials,
    resolvedStaffCases,
    unverifiedCampuses,
    softDeletedStubsRemoved: 0,
  };
}
