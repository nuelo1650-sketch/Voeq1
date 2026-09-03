import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  const vs: any[] = await sql`SELECT id, identity_id FROM vendors WHERE name = 'E2E Vendor'`;
  let n = 0;
  for (const v of vs) {
    const listings: any[] = await sql`SELECT id FROM listings WHERE vendor_id = ${v.id}`;
    for (const l of listings) {
      await sql`DELETE FROM likes WHERE target_type='listing' AND target_id=${l.id}`;
      await sql`DELETE FROM comments WHERE listing_id=${l.id}`;
      await sql`DELETE FROM reports WHERE target_type='listing' AND target_id=${l.id}`;
      await sql`DELETE FROM wishlist_items WHERE listing_id=${l.id}`;
      await sql`DELETE FROM listings WHERE id=${l.id}`;
    }
    await sql`DELETE FROM likes WHERE target_type='vendor' AND target_id=${v.id}`;
    await sql`DELETE FROM follows WHERE vendor_id=${v.id}`;
    await sql`DELETE FROM reviews WHERE vendor_id=${v.id}`;
    if (v.identity_id) {
      await sql`DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE participant_ids @> ${JSON.stringify([v.identity_id])}::jsonb)`;
      await sql`DELETE FROM conversations WHERE participant_ids @> ${JSON.stringify([v.identity_id])}::jsonb`;
    }
    await sql`DELETE FROM vendors WHERE id=${v.id}`;
    if (v.identity_id) await sql`DELETE FROM identities WHERE id=${v.identity_id}`;
    n++;
    console.log("deleted E2E vendor", v.id);
  }
  const check = await sql`SELECT COUNT(*) c FROM vendors WHERE name='E2E Vendor'`;
  console.log("remaining E2E vendors:", check[0].c, "| cleaned:", n);
}
main().catch((e) => { console.error(e); process.exit(1); });
