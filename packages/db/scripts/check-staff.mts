import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  const staff: any[] = await sql`SELECT email, staff_role, account_status FROM identities WHERE staff_role IS NOT NULL`;
  console.log("STAFF:", JSON.stringify(staff));
  const admin = /SUPER_ADMIN_EMAIL=(.+)$/m.exec(env);
  console.log("env SUPER_ADMIN_EMAIL:", admin?.[1] ?? "NOT SET IN .env.local");
}
main().catch((e) => { console.error(e); process.exit(1); });
