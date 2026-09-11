import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const sql = neon(env.match(/DATABASE_URL=([^\n\r]+)/)[1]);
const r = await sql`SELECT id, title, category_id FROM listings WHERE is_published IS TRUE LIMIT 6`;
for (const x of r) console.log(String(x.title).slice(0, 26).padEnd(27), "| category_id:", x.category_id);
