import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  const ls: any[] = await sql`SELECT DISTINCT images[1] AS img FROM listings WHERE images[1] IS NOT NULL`;
  console.log("DISTINCT images:", ls.length);
  for (const l of ls) console.log(" -", l.img.slice(0, 90));
}
main().catch((e) => { console.error(e); process.exit(1); });
