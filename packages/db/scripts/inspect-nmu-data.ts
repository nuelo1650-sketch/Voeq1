import { readFileSync } from "fs";
import { Client } from "@neondatabase/serverless";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=(.*)/);
const client = new Client({ connectionString: m[1] });

async function main() {
  await client.connect();

  // 1. Sample nmu vendor names/handles (placeholder vs real?)
  const vendors = await client.query(
    `SELECT name, handle, slug, status, verified, agreement_accepted_at IS NOT NULL AS has_agreed
     FROM vendors WHERE campus = 'nmu' ORDER BY slug LIMIT 15`,
  );
  console.log("NMD_NMU_VENDORS_SAMPLE:", JSON.stringify(vendors.rows, null, 0));

  // 2. nmu vendor name patterns: how many look placeholder-like?
  const patterns = await client.query(
    `SELECT
       COUNT(*)::int AS total,
       SUM(CASE WHEN name ~* '^(test|demo|vendor|shop|store|sample|example|tmp|temp)' THEN 1 ELSE 0 END)::int AS placeholder_like,
       SUM(CASE WHEN name ~* '[0-9]' THEN 1 ELSE 0 END)::int AS has_digits,
       SUM(CASE WHEN verified THEN 1 ELSE 0 END)::int AS verified,
       SUM(CASE WHEN agreement_accepted_at IS NOT NULL THEN 1 ELSE 0 END)::int AS agreed
     FROM vendors WHERE campus = 'nmu'`,
  );
  console.log("NMD_NMU_PATTERNS:", JSON.stringify(patterns.rows));

  // 3. The 7 identities on nmu
  const ids = await client.query(
    `SELECT email, name, role, account_status, email_verified, created_at
     FROM identities WHERE campus = 'nmu' ORDER BY created_at`,
  );
  console.log("NMD_NMU_IDENTITIES:", JSON.stringify(ids.rows, null, 0));

  // 4. identity email domains on nmu
  const domains = await client.query(
    `SELECT split_part(email,'@',2) AS domain, COUNT(*)::int AS n
     FROM identities WHERE campus = 'nmu' GROUP BY domain ORDER BY n DESC`,
  );
  console.log("NMD_NMU_ID_DOMAINS:", JSON.stringify(domains.rows));

  // 5. other SA vendors sample
  const others = await client.query(
    `SELECT v.campus, v.name, v.handle, v.status,
            (SELECT i.email FROM identities i WHERE i.id = v.identity_id) AS owner_email
     FROM vendors v WHERE v.campus IN ('wits','uct','ukzn','up') ORDER BY v.campus`,
  );
  console.log("NMD_OTHER_SA:", JSON.stringify(others.rows, null, 0));

  // 6. listings tied to nmu vendors
  const listings = await client.query(
    `SELECT COUNT(*)::int AS n FROM listings l JOIN vendors v ON v.id = l.vendor_id WHERE v.campus = 'nmu'`,
  );
  console.log("NMD_NMU_LISTINGS:", JSON.stringify(listings.rows));

  await client.end();
}
main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
