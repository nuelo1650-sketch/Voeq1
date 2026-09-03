import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
const rows: any[] = await sql`SELECT type, ref_id, platform, at FROM page_events ORDER BY at DESC LIMIT 8`;
console.log("PAGE_EVENTS:", rows.length);
for (const r of rows) console.log(" -", r.type, "| ref:", r.ref_id?.slice(0, 12) ?? "-", "|", r.platform, "|", r.at?.slice(0, 19));
