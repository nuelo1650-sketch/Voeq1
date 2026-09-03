import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
if (!m) { console.error("no DATABASE_URL"); process.exit(1); }
const testUrl = m[1].replace(/\/neondb(\?|$)/, "/neondb_test$1");
const sql = neon(testUrl);
const cols: any[] = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='conversations'`;
const names = cols.map((c) => c.column_name ?? c.column_name);
console.log("test DB conversations cols:", names.join(", "));
if (!names.includes("listing_id")) {
  await sql`ALTER TABLE conversations ADD COLUMN listing_id text`;
  console.log("ADDED listing_id to neondb_test");
} else {
  console.log("already has listing_id");
}
const chk: any[] = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='conversations'`;
console.log("after:", chk.map((c) => c.column_name).join(", "));
