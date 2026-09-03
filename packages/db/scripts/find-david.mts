import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  const rows: any[] = await sql`SELECT id, email, name, role, intent, staff_role, account_status, email_verified, google_subject, created_at FROM identities WHERE email LIKE '%owidavid%' OR email LIKE '%@gmail.com'`;
  for (const r of rows) console.log(JSON.stringify(r, null, 1));
}
main().catch((e) => { console.error(e); process.exit(1); });
