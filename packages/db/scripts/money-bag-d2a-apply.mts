/** MONEY BAG D2a — apply vendors.photo_cover to PROD (idempotent ALTER).
 *  Usage: npx tsx scripts/money-bag-d2a-apply.mts [--test] */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
let dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "");
const target = process.argv.includes("--test") ? "TEST" : "PROD";
if (process.argv.includes("--test")) dbUrl = dbUrl.replace("/neondb?", "/neondb_test?");
const sql = neon(dbUrl);

await sql`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS photo_cover text`;
const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='vendors' AND column_name='photo_cover'`;
console.log(`[${target}] photo_cover exists:`, cols.length === 1 ? "YES ✓" : "NO ✗");
process.exit(cols.length === 1 ? 0 : 1);
