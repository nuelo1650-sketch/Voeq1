/**
 * Neon reset — step 3: TRUNCATE all user tables, then re-seed.
 *
 * Founder-approved reset (2026-08-29): all accounts are test accounts.
 * Sequence: typecheck gate PASSED -> snapshot TAKEN -> this truncation.
 *
 * - campuses is truncated too (seed re-inserts the 10 verified ones;
 *   the 5 user-added test campuses are test data).
 * - After truncate, seed.ts runs (idempotent) restoring verified campuses
 *   + super-admin identity.
 * - Snapshot undo path: neon-snapshot-backup-2026-08-29.json
 */
import { getDb } from "@voeq/db";
import { sql } from "drizzle-orm";
import * as s from "@voeq/db/schema";

const db = getDb();

// Every pgTable in schema.ts (names from the live schema).
const tableNames = [
  "identities",
  "sessions",
  "pending_tokens",
  "otps",
  "magic_links",
  "user_preferences",
  "audit_log",
  "vendors",
  "listings",
  "reviews",
  "conversations",
  "messages",
  "staff_cases",
  "wishlist_items",
  "follows",
  "likes",
  "comments",
  "reports",
  "notifications",
  "agreements",
  "feature_flags",
  "activity_events",
  "campuses",
  "nominatim_throttle",
  "categories",
];

// Truncate in ONE statement — CASCADE handles any real FKs; text-only
// pseudo-FKs have no constraints so plain TRUNCATE covers them.
const list = tableNames.map((t) => `"${t}"`).join(", ");
console.log("TRUNCATING:", list);
await db.execute(sql.raw(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`));
console.log("TRUNCATE done.");

// Verify empty state.
for (const t of ["identities", "vendors", "listings", "campuses"]) {
  const res = await db.execute(sql.raw(`SELECT COUNT(*)::int AS n FROM "${t}"`));
  console.log(`${t} after truncate:`, JSON.stringify(res.rows));
}

// Confirm schema exports still resolve (sanity).
console.log("vendors export ok:", typeof s.vendors === "object");
process.exit(0);
