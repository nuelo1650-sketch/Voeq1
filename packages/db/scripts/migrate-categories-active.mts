// Config console P0: categories.is_active (additive, NOT NULL DEFAULT true).
// Existing rows backfill to true automatically via the column default.
// Same pattern as migrate-staff-batch2.mts — idempotent, applies to prod
// (neondb) and test (neondb_test). Run: npx tsx scripts/migrate-categories-active.mts
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
if (!m) { console.error("no DATABASE_URL"); process.exit(1); }

async function migrate(url: string, label: string) {
  const sql = neon(url);
  const cols: any[] = await sql`SELECT column_name, is_nullable, column_default
    FROM information_schema.columns WHERE table_name='categories'`;
  const col = cols.find((c) => c.column_name === "is_active");
  if (!col) {
    await sql`ALTER TABLE categories ADD COLUMN is_active boolean NOT NULL DEFAULT true`;
    console.log(`[${label}] added categories.is_active`);
  } else {
    console.log(`[${label}] is_active exists (nullable=${col.is_nullable}, default=${col.column_default})`);
  }
  const rows: any[] = await sql`SELECT count(*)::int AS n FROM categories WHERE is_active = false`;
  console.log(`[${label}] inactive categories: ${rows[0].n}`);
}

await migrate(m[1], "prod");
await migrate(m[1].replace(/\/neondb(\?|$)/, "/neondb_test$1"), "test");
console.log("done");
