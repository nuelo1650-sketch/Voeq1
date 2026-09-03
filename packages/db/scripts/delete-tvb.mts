import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
const v: any[] = await sql`SELECT id, name FROM vendors WHERE slug = 'test-vendor-biz-6682'`;
console.log("tbv rows:", JSON.stringify(v));
for (const r of v) {
  try {
    await sql`DELETE FROM vendors WHERE id = ${r.id}`;
    console.log("deleted", r.id.slice(0, 8));
  } catch (e: any) {
    console.log("delete failed:", e?.message?.slice(0, 120));
  }
}
const vs: any[] = await sql`SELECT name, slug FROM vendors ORDER BY name`;
console.log("FINAL:", vs.map((x) => x.name).join(" | "));
