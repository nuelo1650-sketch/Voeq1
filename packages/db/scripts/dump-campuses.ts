import { readFileSync } from "fs";
import { Client } from "@neondatabase/serverless";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=(.*)/);
if (!m) { console.error("no DATABASE_URL"); process.exit(1); }
const client = new Client({ connectionString: m[1] });

async function main() {
  await client.connect();

  // 1. Schema of campuses (column names + types)
  const schema = await client.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_name = 'campuses' ORDER BY ordinal_position`,
  );
  console.log("CAMPUSES_SCHEMA:", JSON.stringify(schema.rows));

  // 2. Full data dump of campuses
  const data = await client.query(
    `SELECT id, name, slug, region FROM campuses ORDER BY slug`,
  );
  console.log("CAMPUSES_DATA:", JSON.stringify(data.rows));
  console.log("CAMPUSES_COUNT:", data.rows.length);

  // 3. Confirm the 3 personal accounts + their current campus
  const personal = await client.query(
    `SELECT id, email, name, campus FROM identities
     WHERE email IN ('nuelo1650@gmail.com','owiemmanuel2020@gmail.com','voeq100@gmail.com')
     ORDER BY email`,
  );
  console.log("PERSONAL_ACCTS:", JSON.stringify(personal.rows, null, 0));

  await client.end();
}
main().catch((e) => { console.error("ERR", e.message); process.exit(1); });
