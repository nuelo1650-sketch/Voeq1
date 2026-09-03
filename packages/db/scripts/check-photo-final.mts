import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  const vs: any[] = await sql`SELECT name, slug, profile_photo_url FROM vendors ORDER BY name`;
  for (const v of vs) console.log(v.name, "| photo:", v.profile_photo_url ? "SET" : "NULL");
}
main();
