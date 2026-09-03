import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  const vs: any[] = await sql`SELECT name, campus, category_ids FROM vendors`;
  for (const v of vs) console.log(v.name, "| campus:", v.campus ?? "NULL", "| cats:", JSON.stringify(v.category_ids ?? "NULL"));
}
main().catch((e) => { console.error(e); process.exit(1); });
