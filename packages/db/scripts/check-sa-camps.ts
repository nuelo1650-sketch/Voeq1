import { readFileSync } from "fs";
import { Client } from "@neondatabase/serverless";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=(.*)/);
if (!m) {
  console.error("no DATABASE_URL");
  process.exit(1);
}
const client = new Client({ connectionString: m[1] });

async function main() {
  await client.connect();
  const q = `SELECT 'identities' AS tbl, campus, COUNT(*)::int AS n FROM identities WHERE campus IN ('nmu','rhodes','wits','uct','up','ukzn','tut','cput','uwc','unisa') GROUP BY campus
  UNION ALL SELECT 'vendors', campus, COUNT(*)::int FROM vendors WHERE campus IN ('nmu','rhodes','wits','uct','up','ukzn','tut','cput','uwc','unisa') GROUP BY campus
  UNION ALL SELECT 'user_preferences', campus, COUNT(*)::int FROM user_preferences WHERE campus IN ('nmu','rhodes','wits','uct','up','ukzn','tut','cput','uwc','unisa') GROUP BY campus`;
  const r = await client.query(q);
  console.log("SA_USAGE_ROWS:", JSON.stringify(r.rows));
  const c2 = await client.query("SELECT slug, name, region FROM campuses ORDER BY slug");
  console.log("CURRENT_CAMPUSES:", JSON.stringify(c2.rows));
  await client.end();
}
main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
