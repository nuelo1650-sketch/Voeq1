import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  const email = "owidavid2002@gmail.com";
  const rows: any[] = await sql`SELECT id, staff_role, account_status FROM identities WHERE email=${email}`;
  if (rows.length === 0) {
    console.log("no identity; create pending + promote");
    const ins: any[] = await sql`INSERT INTO identities (id, email, name, method, role, intent, account_status, email_verified, created_at, updated_at) VALUES (gen_random_uuid(), ${email}, 'David Owi', 'email', 'shopper', null, 'active', true, now(), now()) RETURNING id`;
    console.log("created", ins[0].id);
    await sql`UPDATE identities SET staff_role='super_admin' WHERE email=${email}`;
  } else {
    await sql`UPDATE identities SET staff_role='super_admin', account_status='active' WHERE email=${email}`;
    console.log("promoted existing", rows[0].id);
  }
  const chk: any[] = await sql`SELECT email, staff_role FROM identities WHERE email=${email}`;
  console.log("RESULT:", JSON.stringify(chk[0]));
}
main().catch((e) => { console.error(e); process.exit(1); });
