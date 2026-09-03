import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  const rows: any[] = await sql`SELECT id, email, name, role, vendor_id, account_status FROM identities ORDER BY created_at DESC LIMIT 6`;
  for (const r of rows) console.log(r.email, "| role:", r.role, "| vendor_id:", r.vendor_id ?? "-", "| status:", r.account_status);
}
main().catch((e) => { console.error(e); process.exit(1); });
