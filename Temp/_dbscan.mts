import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const t = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const base = t.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "");
for (const [name, u] of [["PROD", base], ["TEST", base.replace("/neondb?", "/neondb_test?")]] as const) {
  const sql = neon(u);
  const r = await sql`SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='vendors' AND column_name IN ('campus','area_id')`;
  console.log(name, JSON.stringify(r));
}
