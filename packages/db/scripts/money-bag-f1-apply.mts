/** MONEY BAG F1 — apply campus-nullable to vendors (prod, or --test). Idempotent. */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const t = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
let u = t.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "");
const target = process.argv.includes("--test") ? "TEST" : "PROD";
if (process.argv.includes("--test")) u = u.replace("/neondb?", "/neondb_test?");
const sql = neon(u);
await sql`ALTER TABLE vendors ALTER COLUMN campus DROP NOT NULL`;
const r = await sql`SELECT is_nullable FROM information_schema.columns WHERE table_name='vendors' AND column_name='campus'`;
console.log(target, "vendors.campus nullable now:", r[0]?.is_nullable === "YES" ? "YES ✓" : "NO ✗");
process.exit(r[0]?.is_nullable === "YES" ? 0 : 1);
