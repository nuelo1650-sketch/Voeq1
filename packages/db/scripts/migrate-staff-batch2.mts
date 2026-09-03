// Staff enforcement batch 2 (P6b): auth_events age index for the retention purge.
// Additive only (CREATE INDEX). Applies to prod (neondb) and test (neondb_test),
// same pattern as migrate-staff-batch1.mts. Run: npx tsx scripts/migrate-staff-batch2.mts
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
if (!m) { console.error("no DATABASE_URL"); process.exit(1); }

async function migrate(url: string, label: string) {
  const sql = neon(url);
  const idx: any[] = await sql`SELECT indexname FROM pg_indexes WHERE tablename='auth_events'`;
  if (!idx.some((i) => i.indexname === "auth_events_at_idx")) {
    await sql`CREATE INDEX auth_events_at_idx ON auth_events (at)`;
    console.log(`[${label}] added auth_events_at_idx`);
  } else {
    console.log(`[${label}] auth_events_at_idx exists`);
  }
}

await migrate(m[1], "prod");
await migrate(m[1].replace(/\/neondb(\?|$)/, "/neondb_test$1"), "test");
console.log("done");
