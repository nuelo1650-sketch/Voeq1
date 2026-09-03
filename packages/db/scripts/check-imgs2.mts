import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  const ls: any[] = await sql`SELECT id, title, images FROM listings ORDER BY created_at`;
  for (const l of ls) console.log(l.title, "|", JSON.stringify(l.images ?? []).slice(1, 100));
}
main().catch((e) => { console.error(e); process.exit(1); });
