import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
if (!m?.[1]) throw new Error("NO DATABASE_URL in apps/web/.env.local");
const sql = neon(m[1]);

// P-A round 29: locate the junk test vendor (slug mama-nkechi-2c35) + identity
// + its listings so we can clean it child-first.
async function main() {
  const vendors: any[] = await sql`SELECT * FROM vendors WHERE slug = 'mama-nkechi-2c35' OR name = 'Mama nkechi'`;
  for (const v of vendors) {
    console.log("VENDOR:", JSON.stringify({ id: v.id, name: v.name, slug: v.slug, identityId: v.identity_id, campus: v.campus, status: v.status, photoUrl: (v.profile_photo_url ?? "").slice(0, 70) }, null, 1));
    const listings = await sql`SELECT id, title, images FROM listings WHERE vendor_id = ${v.id}`;
    console.log("  LISTINGS:", listings.map((l: any) => ({ id: l.id, title: l.title, img: JSON.stringify(l.images ?? []).slice(1, 70) })));
  }
  const identities = await sql`SELECT id, email, name, account_status FROM identities ORDER BY created_at DESC LIMIT 8`;
  console.log("IDENTITIES (latest):");
  for (const i of identities) console.log(" -", i.email, "|", i.name, "|", i.account_status);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
