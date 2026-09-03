import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  const vs: any[] = await sql`SELECT name, profile_photo_url FROM vendors`;
  for (const v of vs) console.log(v.name, "| photo:", (v.profile_photo_url ?? "NONE").slice(0, 70));
  const ls: any[] = await sql`SELECT title, images FROM listings LIMIT 7`;
  for (const l of ls) console.log("LISTING", l.title, "| imgs:", JSON.stringify(l.images ?? []).slice(1, 80));
}
main().catch((e) => { console.error(e); process.exit(1); });
