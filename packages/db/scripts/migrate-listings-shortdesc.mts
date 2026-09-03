import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
if (!m) { console.error("no DATABASE_URL"); process.exit(1); }

async function migrate(url: string, label: string) {
  const sql = neon(url);
  const cols: any[] = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='listings'`;
  const names = cols.map((c) => c.column_name);
  if (!names.includes("short_description")) {
    await sql`ALTER TABLE listings ADD COLUMN short_description text`;
    console.log(`[${label}] ADDED short_description`);
  } else {
    console.log(`[${label}] already has short_description`);
  }
}
await migrate(m[1], "prod");
await migrate(m[1].replace(/\/neondb(\?|$)/, "/neondb_test$1"), "test");
