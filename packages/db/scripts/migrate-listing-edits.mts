/**
 * Migration: listing_edits (listing integrity audit, 2026-09-05).
 * Additive, idempotent. Run: npx tsx scripts/migrate-listing-edits.mts
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const PROD = env.match(/DATABASE_URL=([^\n\r]+)/)[1];
const TEST = PROD.replace("/neondb?", "/neondb_test?");

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS listing_edits (
    id text PRIMARY KEY,
    listing_id text NOT NULL,
    vendor_id text NOT NULL,
    at text NOT NULL,
    fields jsonb NOT NULL,
    similarity integer,
    engagement jsonb NOT NULL,
    action text NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS listing_edits_listing_idx ON listing_edits (listing_id)`,
];

for (const [name, url] of [["prod", PROD], ["test", TEST]] as const) {
  const sql = neon(url);
  for (const stmt of STATEMENTS) await sql(stmt);
  console.log(`[${name}] listing_edits ready`);
}
console.log("done");
