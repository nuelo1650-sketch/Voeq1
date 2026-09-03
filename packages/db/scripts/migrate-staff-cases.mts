import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
if (!m) { console.error("no DATABASE_URL"); process.exit(1); }

async function migrate(url: string, label: string) {
  const sql = neon(url);
  const cols: any[] = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='staff_cases'`;
  const names = cols.map((c) => c.column_name);
  console.log(`[${label}] staff_cases cols:`, names.join(", "));
  if (!names.includes("payload")) {
    await sql`ALTER TABLE staff_cases ADD COLUMN payload jsonb DEFAULT '{}'::jsonb`;
    console.log(`[${label}] ADDED payload`);
  }
  if (!names.includes("created_at")) {
    await sql`ALTER TABLE staff_cases ADD COLUMN created_at text DEFAULT ''`;
    await sql`UPDATE staff_cases SET created_at = '' WHERE created_at IS NULL`;
    console.log(`[${label}] ADDED created_at`);
  }
  const chk: any[] = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='staff_cases'`;
  console.log(`[${label}] after:`, chk.map((c) => c.column_name).join(", "));
}

await migrate(m[1], "prod");
await migrate(m[1].replace(/\/neondb(\?|$)/, "/neondb_test$1"), "test");
