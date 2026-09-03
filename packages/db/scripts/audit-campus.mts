import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const sql = neon(env.match(/DATABASE_URL=([^\n\r]+)/)[1]);
const r = await sql`SELECT id, name, campus, status FROM vendors ORDER BY status, name`;
for (const v of r) console.log(" ", (v.name ?? "?").slice(0, 26).padEnd(27), "| campus:", String(v.campus).padEnd(10), "| status:", v.status);
