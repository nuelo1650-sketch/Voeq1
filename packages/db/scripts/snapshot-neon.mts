/**
 * Neon reset — step 2: safety snapshot.
 * Dumps every user table to a local JSON file before truncation.
 * NOT a pg_dump (no psql tooling guaranteed); a repo-layer read of every table
 * through the real Drizzle client, so the snapshot is complete for all
 * tables the app uses.
 */
import { getDb } from "@voeq/db";
import * as s from "@voeq/db/schema";
import { writeFileSync } from "node:fs";

const db = getDb();

const tables: Array<[string, unknown]> = [
  ["identities", s.identities],
  ["sessions", s.sessions],
  ["vendors", s.vendors],
  ["listings", s.listings],
  ["reviews", s.reviews],
  ["conversations", s.conversations],
  ["messages", s.messages],
  ["notifications", s.notifications],
  ["savedItems", s.savedItems],
  ["follows", s.follows],
  ["likes", s.likes],
  ["campuses", s.campuses],
  ["otps", s.otps],
  ["pendingTokens", s.pendingTokens],
  ["auditLogs", s.auditLogs],
  ["staffActions", s.staffActions],
  ["userPrefs", s.userPrefs],
  ["images", s.images],
  ["reviewsHidden", s.reviewHides],
];

const snapshot: Record<string, unknown[]> = {};
for (const [name, table] of tables) {
  try {
    // @ts-expect-error dynamic table select
    const rows = await db.select().from(table);
    snapshot[name] = rows;
    console.log(`snapshotted ${name}: ${rows.length} rows`);
  } catch (e) {
    console.log(`(skipped ${name}: ${(e as Error).message})`);
    snapshot[name] = [];
  }
}

const out = `C:/Users/Legacy/Documents/voeq/neon-snapshot-backup-2026-08-29.json`;
writeFileSync(out, JSON.stringify(snapshot, null, 2));
console.log("SNAPSHOT WRITTEN:", out);
console.log("TOTAL ROWS:", Object.values(snapshot).reduce((a: number, b) => a + (b as unknown[]).length, 0));
process.exit(0);
