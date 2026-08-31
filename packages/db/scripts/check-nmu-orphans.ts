import { readFileSync } from "fs";
import { Client } from "@neondatabase/serverless";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=(.*)/);
if (!m) { console.error("no DATABASE_URL"); process.exit(1); }
const client = new Client({ connectionString: m[1] });

async function main() {
  await client.connect();

  // 1. Vendor rows still on campus: "nmu" (orphaned after Pre-B1 migration)
  const vendors = await client.query(
    `SELECT v.id, v.name, v.campus, i.email
     FROM vendors v LEFT JOIN identities i ON i.id = v.identity_id
     WHERE v.campus = 'nmu'`,
  );
  console.log("VENDORS_ON_NMU:", vendors.rowCount, JSON.stringify(vendors.rows, null, 0));

  // 2. Identities still on campus: "nmu" (should be 0 after migration)
  const ids = await client.query(
    `SELECT id, email, campus, created_at FROM identities WHERE campus = 'nmu' ORDER BY created_at`,
  );
  console.log("IDENTITIES_ON_NMU:", ids.rowCount, JSON.stringify(ids.rows, null, 0));

  // 3. user_preferences still on "nmu"
  const prefs = await client.query(
    `SELECT identity_id, campus FROM user_preferences WHERE campus = 'nmu'`,
  );
  console.log("PREFS_ON_NMU:", prefs.rowCount, JSON.stringify(prefs.rows, null, 0));

  // 4. Total vendors on Nigerian campuses (sanity check)
  const total = await client.query(
    `SELECT campus, COUNT(*)::int AS n FROM vendors GROUP BY campus ORDER BY campus`,
  );
  console.log("VENDORS_BY_CAMPUS:", JSON.stringify(total.rows));

  await client.end();
}
main().catch((e) => { console.error("ERR", e.message); process.exit(1); });
