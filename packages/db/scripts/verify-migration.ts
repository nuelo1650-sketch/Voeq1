import { readFileSync } from "fs";
import { Client } from "@neondatabase/serverless";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=(.*)/);
if (!m) { console.error("no DATABASE_URL"); process.exit(1); }
const client = new Client({ connectionString: m[1] });

async function main() {
  await client.connect();

  const data = await client.query(
    `SELECT slug, name, city, state, lat, lng, source, status FROM campuses ORDER BY slug`,
  );
  console.log("CAMPUSES:", JSON.stringify(data.rows, null, 1));
  console.log("COUNT:", data.rows.length);

  // Confirm nmu-okerenkoko specifically
  const nmu = await client.query(
    `SELECT slug, name, lat, lng, status FROM campuses WHERE slug = 'nmu-okerenkoko'`,
  );
  console.log("NMU_OKERENKOKO:", JSON.stringify(nmu.rows));

  // Confirm personal accounts resolved
  const personal = await client.query(
    `SELECT email, campus FROM identities WHERE email IN ('nuelo1650@gmail.com','owiemmanuel2020@gmail.com','voeq100@gmail.com') ORDER BY email`,
  );
  console.log("PERSONAL_RESOLVED:", JSON.stringify(personal.rows));

  // Confirm no SA slugs remain
  const sa = await client.query(
    `SELECT slug FROM campuses WHERE slug IN ('nmu','rhodes','wits','uct','up','ukzn','tut','cput','uwc','unisa')`,
  );
  console.log("SA_REMAINING:", sa.rows.length);

  await client.end();
}
main().catch((e) => { console.error("ERR", e.message); process.exit(1); });
