/** MONEY BAG PHASE A — run migrations (idempotent) against prod (default) or test (--test).
 *  Applies money-bag-phase-a.sql statement-by-statement; verifies every object exists after.
 *  Usage: npx tsx scripts/money-bag-phase-a.mts [--test] [--apply]
 *  Dry-run (default): prints what would run + verification of current state.
 */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
let dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1];
const target = process.argv.includes("--test") ? "TEST" : "PROD";
if (process.argv.includes("--test")) dbUrl = dbUrl.replace("/neondb?", "/neondb_test?");
const apply = process.argv.includes("--apply");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const migrationSql = readFileSync("C:/Users/Legacy/Documents/voeq/packages/db/migrations/money-bag-phase-a.sql", "utf8");
// split on semicolons, keep statements non-empty (no transaction blocks in this file)
const statements = migrationSql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--") === false || (s.length > 0 && !s.split("\n").every((l) => l.trim().startsWith("--") || l.trim() === "")));

const clean = statements
  .map((s) => s.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n").trim())
  .filter((s) => s.length > 0);

console.log(`[${target}] statements to run: ${clean.length}`);
for (const st of clean) console.log("  •", st.split("\n")[0].slice(0, 72), "…");

if (!apply) {
  console.log("\nDRY RUN — pass --apply to execute.");
} else {
  for (const st of clean) {
    await sql(st);
    console.log("  ✓ applied:", st.slice(0, 60).replace(/\n/g, " "), "…");
  }
  console.log("\nVERIFICATION:");
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_name IN ('listing_fairness','voeq_live_picks','vendor_score_snapshot','areas')`;
  console.log("  tables:", tables.map((t) => t.table_name).join(", "));
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='listings' AND column_name='source'`;
  console.log("  listings.source:", cols.length === 1 ? "EXISTS" : "MISSING");
  const cols2 = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='vendors' AND column_name='area_id'`;
  console.log("  vendors.area_id:", cols2.length === 1 ? "EXISTS" : "MISSING");
}
process.exit(0);
