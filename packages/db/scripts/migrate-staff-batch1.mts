// Staff enforcement batch 1: auth_events table + identities ladder columns.
// Additive only. Applies to prod (neondb) and test (neondb_test), same pattern
// as migrate-page-events.mts. Run: npx tsx scripts/migrate-staff-batch1.mts
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
if (!m) { console.error("no DATABASE_URL"); process.exit(1); }

async function migrate(url: string, label: string) {
  const sql = neon(url);

  // 1. auth_events table
  const tbl: any[] = await sql`SELECT table_name FROM information_schema.tables WHERE table_name='auth_events'`;
  if (tbl.length === 0) {
    await sql`CREATE TABLE auth_events (
      id text PRIMARY KEY,
      identity_id text,
      event text NOT NULL,
      email text,
      ip text,
      user_agent text,
      at text NOT NULL
    )`;
    console.log(`[${label}] CREATED auth_events`);
  } else {
    console.log(`[${label}] auth_events exists`);
  }
  const idx: any[] = await sql`SELECT indexname FROM pg_indexes WHERE tablename='auth_events'`;
  if (!idx.some((i) => i.indexname === "auth_events_identity_at_idx")) {
    await sql`CREATE INDEX auth_events_identity_at_idx ON auth_events (identity_id, at)`;
    console.log(`[${label}] added auth_events_identity_at_idx`);
  }

  // 2. identities ladder columns
  const cols: any[] = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='identities'`;
  const have = new Set(cols.map((c) => c.column_name));
  if (!have.has("suspension_expires_at")) {
    await sql`ALTER TABLE identities ADD COLUMN suspension_expires_at text`;
    console.log(`[${label}] added identities.suspension_expires_at`);
  }
  if (!have.has("warning_count")) {
    await sql`ALTER TABLE identities ADD COLUMN warning_count integer NOT NULL DEFAULT 0`;
    console.log(`[${label}] added identities.warning_count`);
  }
}

await migrate(m[1], "prod");
await migrate(m[1].replace(/\/neondb(\?|$)/, "/neondb_test$1"), "test");
console.log("done");
