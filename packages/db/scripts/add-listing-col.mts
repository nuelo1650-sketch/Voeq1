import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  try {
    await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS listing_id text`;
    const cols: any[] = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='conversations' ORDER BY ordinal_position`;
    console.log("conversations columns:", cols.map((c) => c.column_name).join(", "));
  } catch (e) { console.error("ERR:", e); process.exit(1); }
}
main();
