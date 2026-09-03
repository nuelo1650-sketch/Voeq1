import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  const CLOUD = "https://res.cloudinary.com/jq9gwigz/image/upload/v1788151594/voeq-demo";
  const photos: [string, string][] = [
    ["demo-campus-threads", `${CLOUD}/jollof-bowl.jpg`],
    ["demo-kiki-beauty-bar", `${CLOUD}/box-braids.jpg`],
    ["demo-byte-shop", `${CLOUD}/laptop-clean.jpg`],
  ];
  for (const [slug, photo] of photos) {
    await sql`UPDATE vendors SET profile_photo_url = ${photo} WHERE slug = ${slug}`;
    console.log("set:", slug);
  }
  const chk: any[] = await sql`SELECT name, profile_photo_url FROM vendors ORDER BY name`;
  for (const c of chk) console.log(c.name, "|", c.profile_photo_url ? "PHOTO ✓" : "NULL");
}
main().catch((e) => { console.error(e); process.exit(1); });
