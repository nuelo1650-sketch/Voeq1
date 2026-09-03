import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  const rows: any[] = await sql`SELECT v.id, v.name, v.identity_id, i.id AS identity_candidate, i.email FROM vendors v LEFT JOIN identities i ON i.id = v.identity_id`;
  for (const r of rows) console.log(r.name, "| identity_id:", r.identity_id ?? "NULL", "| matched:", r.identity_candidate ?? "NONE");
}
main().catch((e) => { console.error(e); process.exit(1); });
