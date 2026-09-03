import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
const vs: any[] = await sql`SELECT id, name, campus FROM vendors ORDER BY name`;
for (const v of vs) console.log(v.name, "| campus:", JSON.stringify(v.campus));
