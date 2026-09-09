/** MONEY BAG B3 — apply the areas seed (prod default, --test for test DB). Idempotent.
 *  Usage: npx tsx scripts/money-bag-areas-seed.mts [--test]
 */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
let dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1];
const target = process.argv.includes("--test") ? "TEST" : "PROD";
if (process.argv.includes("--test")) dbUrl = dbUrl.replace("/neondb?", "/neondb_test?");

const sqlText = readFileSync("C:/Users/Legacy/Documents/voeq/packages/db/migrations/money-bag-areas-seed.sql", "utf8");
// The seed is ONE multi-row INSERT ending at the first ';' after VALUES rows.
// Strip comment lines first, then take everything up to the ON CONFLICT terminator.
const cleaned = sqlText
  .split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n");
const statements = cleaned
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.toUpperCase().startsWith("INSERT"));

const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

console.log(`AREAS SEED — target: ${target}, statements: ${statements.length}`);
for (const stmt of statements) {
  const head = stmt.replace(/\s+/g, " ").slice(0, 60);
  try {
    await sql(stmt);
    console.log(`  ✓ ${head}…`);
  } catch (e) {
    console.error(`  ✗ ${head}…`, String(e).slice(0, 140));
    process.exit(1);
  }
}

// verify
const states = await sql`SELECT count(DISTINCT state_name)::int AS n FROM areas`;
const total = await sql`SELECT count(*)::int AS n FROM areas`;
const delta = await sql`SELECT area_name FROM areas WHERE state_name = 'Delta' ORDER BY area_name`;
console.log(`\nVERIFICATION: ${states[0].n} states+FCT, ${total[0].n} areas total`);
console.log(`Delta areas: ${delta.map((d) => d.area_name).join(", ")}`);
