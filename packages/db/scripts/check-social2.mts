import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
const r = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name ILIKE '%save%' OR table_name ILIKE '%wish%' OR table_name ILIKE '%follow%' OR table_name ILIKE '%like%')`;
for (const row of r) console.log("TABLE:", row.table_name);
