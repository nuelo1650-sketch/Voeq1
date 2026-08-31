import { readFileSync } from "fs";
import { Client } from "@neondatabase/serverless";

async function main() {
  const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
  const m = env.match(/DATABASE_URL=([^\n\r]+)/);
  if (!m?.[1]) { console.log("NO DATABASE_URL found"); return; }
  const client = new Client({ connectionString: m[1], connectionTimeoutMillis: 15000 });

  try {
    await client.connect();
    const campuses = await client.query(`SELECT slug, name, status FROM campuses ORDER BY name`);
    const liveVendors = await client.query(`SELECT COUNT(*)::int AS n FROM vendors WHERE status = 'live'`);

    console.log("CAMPUSES:");
    campuses.rows.forEach((c: any) => console.log(`  ${c.slug} — ${c.name} (${c.status})`));
    console.log(`\nLIVE VENDORS: ${liveVendors.rows[0].n}`);
  } catch (e: any) {
    console.error("QUERY ERROR:", e.message);
  } finally {
    await client.end();
  }
}

main();
