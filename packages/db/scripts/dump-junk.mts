import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  const vs: any[] = await sql`SELECT id, name, slug, identity_id, campus, status, profile_photo_url FROM vendors WHERE name = 'Mama nkechi'`;
  for (const v of vs) {
    console.log("VENDOR_ID:", v.id);
    console.log("IDENTITY_ID:", v.identity_id);
    console.log("OTHER:", JSON.stringify({ slug: v.slug, campus: v.campus, status: v.status, photo: (v.profile_photo_url ?? "").slice(0, 60) }));
  }
  const ls: any[] = await sql`SELECT id, title FROM listings WHERE vendor_id = ${(vs[0] as any)?.id}`;
  for (const l of ls) console.log("LISTING:", l.id, "|", l.title);
}
main().catch((e) => { console.error(e); process.exit(1); });
