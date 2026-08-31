import { readFileSync } from "fs";
import { Client } from "@neondatabase/serverless";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=(.*)/);
const client = new Client({ connectionString: m[1] });

async function main() {
  await client.connect();
  const v = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='vendors' ORDER BY ordinal_position",
  );
  console.log("VENDOR_COLS:", JSON.stringify(v.rows.map((x: any) => x.column_name)));
  const i = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='identities' ORDER BY ordinal_position",
  );
  console.log("IDENTITY_COLS:", JSON.stringify(i.rows.map((x: any) => x.column_name)));
  await client.end();
}
main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
