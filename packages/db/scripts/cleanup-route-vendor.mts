import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  const ids: any[] = await sql`SELECT id FROM identities WHERE email LIKE 'vendor-route-%'`;
  for (const i of ids) {
    const vs: any[] = await sql`SELECT id FROM vendors WHERE identity_id=${i.id}`;
    for (const v of vs) {
      const ls: any[] = await sql`SELECT id FROM listings WHERE vendor_id=${v.id}`;
      for (const l of ls) {
        await sql`DELETE FROM comments WHERE listing_id=${l.id}`;
        await sql`DELETE FROM listings WHERE id=${l.id}`;
      }
      await sql`DELETE FROM vendors WHERE id=${v.id}`;
    }
    await sql`DELETE FROM identities WHERE id=${i.id}`;
    console.log("cleaned", i.id);
  }
  console.log("done");
}
main().catch((e) => { console.error(e); process.exit(1); });
