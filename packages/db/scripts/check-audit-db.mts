import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
const rows: any[] = await sql`SELECT type, count(*)::int AS n FROM audit_log GROUP BY type ORDER BY n DESC`;
console.log("AUDIT LOG TYPES:", JSON.stringify(rows));
const recent: any[] = await sql`SELECT type, at FROM audit_log ORDER BY at DESC LIMIT 5`;
for (const r of recent) console.log(" -", r.type, "|", r.at?.slice(0, 19));
