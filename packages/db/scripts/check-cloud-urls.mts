import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
const l = await sql`SELECT id, title, images FROM listings WHERE images IS NOT NULL LIMIT 5`;
for (const row of l) { console.log(row.title?.slice(0,30), "->", (row.images as any).slice(0,1)?.[0]?.slice?.(0,110) ?? JSON.stringify(row.images).slice(0,110)); }
