import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
if (!m?.[1]) throw new Error("NO DATABASE_URL");
const sql = neon(m[1]);

// P-A round 29: remove the junk test vendor 'Mama nkechi' created through the
// OLD broken signup flow (gibberish description, voeq-mock broken photos).
// Child-first: messages/conversations via identity, reviews/likes/comments/
// wishes via vendor+listings, then listings, then vendor, then identity row only
// if it belongs to this vendor (it has no other role).
async function main() {
  const VENDOR = "d088bd28-795f-4576-b837-e40c3ae3cdd6";
  const IDENTITY = "ecdfe078-7e10-41d8-bd40-70c9a99dd4c0";
  const LISTING = "47fd9cc4-4f83-4ca2-8be5-5de5d8f23e38";

  // 1. listing children
  await sql`DELETE FROM likes WHERE target_type = 'listing' AND target_id = ${LISTING}`;
  await sql`DELETE FROM reports WHERE target_type = 'listing' AND target_id = ${LISTING}`;
  await sql`DELETE FROM comments WHERE listing_id = ${LISTING}`;
  await sql`DELETE FROM wishlist_items WHERE listing_id = ${LISTING}`;
  await sql`DELETE FROM listings WHERE id = ${LISTING}`;
  console.log("listing + children deleted");

  // 2. vendor children
  await sql`DELETE FROM likes WHERE target_type = 'vendor' AND target_id = ${VENDOR}`;
  await sql`DELETE FROM follows WHERE vendor_id = ${VENDOR}`;
  await sql`DELETE FROM reviews WHERE vendor_id = ${VENDOR}`;
  await sql`DELETE FROM wishlist_items WHERE vendor_id = ${VENDOR}`;
  await sql`DELETE FROM vendors WHERE id = ${VENDOR}`;
  console.log("vendor + children deleted");

  // 3. identity (conversations/messages + identity)
  await sql`DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE participant_ids @> ${JSON.stringify([IDENTITY])}::jsonb)`;
  await sql`DELETE FROM conversations WHERE participant_ids @> ${JSON.stringify([IDENTITY])}::jsonb`;
  await sql`DELETE FROM otps WHERE email = (SELECT email FROM identities WHERE id = ${IDENTITY})`;
  await sql`DELETE FROM identities WHERE id = ${IDENTITY}`;
  console.log("identity + conversations deleted");

  // verify
  const check = await sql`SELECT
    (SELECT COUNT(*) FROM vendors WHERE id = ${VENDOR}) AS v,
    (SELECT COUNT(*) FROM identities WHERE id = ${IDENTITY}) AS i,
    (SELECT COUNT(*) FROM listings WHERE id = ${LISTING}) AS l`;
  console.log("REMAINING (should be 0/0/0):", JSON.stringify(check[0]));
}
main().catch((e) => { console.error(e); process.exit(1); });
