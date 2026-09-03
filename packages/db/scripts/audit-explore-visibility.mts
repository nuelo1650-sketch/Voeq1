import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);

const r = await sql`
  SELECT l.id, l.title, l.is_published, l.status, l.vendor_id, v.name vendor, v.status vendor_status
  FROM listings l JOIN vendors v ON v.id = l.vendor_id
  ORDER BY l.id DESC LIMIT 15`;
console.log("LISTINGS in DB (is_published / status / vendor live?):");
for (const x of r) {
  console.log(" ", (x.title ?? "?").slice(0, 34).padEnd(35), "| pub:", String(x.is_published).padEnd(5), "| status:", String(x.status).padEnd(10), "| vendor:", (x.vendor ?? "?").slice(0, 20).padEnd(21), "| vstatus:", x.vendor_status);
}
const counts = await sql`
  SELECT is_published, status, count(*) n FROM listings GROUP BY is_published, status ORDER BY n DESC`;
console.log("\nSUMMARY:", JSON.stringify(counts));
