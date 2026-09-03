import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);

const dbg = {};

// What did the subagents leave behind?
const vendors: any[] = await sql`SELECT id, name, slug FROM vendors WHERE name ILIKE '%audit%' OR name ILIKE '%legacy%' ORDER BY name`;
console.log("TEST VENDORS:", JSON.stringify(vendors, null, 1).slice(0, 500));
const cases: any[] = await sql`SELECT id, queue, decision, status, created_at FROM staff_cases ORDER BY created_at DESC LIMIT 10`;
console.log("STAFF CASES:");
for (const c of cases) console.log(" -", c.id.slice(0, 8), "|", c.queue, "|", c.decision, "|", c.status, "|", String(c.created_at).slice(0, 20));
const reports: any[] = await sql`SELECT id, target_type, target_id, category FROM reports ORDER BY created_at DESC LIMIT 10`;
console.log("REPORTS:");
for (const r of reports) console.log(" -", r.id.slice(0, 8), "|", r.target_type, "|", r.target_id.slice(0, 12), "|", r.category);
