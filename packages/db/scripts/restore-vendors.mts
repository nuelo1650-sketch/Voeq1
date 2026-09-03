import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);

// 1) Show all vendors + their listings so we restore deliberately.
const vs: any[] = await sql`SELECT id, name, slug, description, campus FROM vendors ORDER BY name`;
console.log("VENDORS NOW:");
for (const v of vs) console.log(" -", v.id.slice(0, 8), "|", v.name, "| slug:", v.slug, "| campus:", v.campus);
const ls: any[] = await sql`SELECT id, vendor_id, title FROM listings`;
console.log("LISTINGS:");
for (const l of ls) console.log(" -", l.vendor_id.slice(0, 8), "|", l.title);
