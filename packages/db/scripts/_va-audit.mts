/** BUG AUDIT (founder: "new vendors are not being seen in admin for
 *  verification of their account"): trace the FULL path on prod:
 *  1) How many vendors exist without `verified`?
 *  2) How many have OPEN verification cases in staff_cases?
 *  3) Do vendors WITHOUT a case exist (never requested / auto-path missing)?
 *  4) Was a case created but resolved already (queue-filter hides it)?
 */
import { readFileSync } from "node:fs";
const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1];
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const unverified = await sql`SELECT v.id, v.name, v.status, v.created_at FROM vendors v WHERE v.verified = false ORDER BY v.created_at DESC LIMIT 10`;
console.log("unverified vendors (newest 10):", JSON.stringify(unverified.map((v) => ({ name: v.name, status: v.status, created: String(v.created_at).slice(0, 10) })), null, 1));
const cnt = await sql`SELECT count(*) AS n FROM vendors WHERE verified = false`;
console.log("total unverified:", cnt[0].n);

const openCases = await sql`SELECT id, status, payload FROM staff_cases WHERE queue = 'verifications' ORDER BY created_at DESC LIMIT 10`;
console.log("verification cases (newest 10):", JSON.stringify(openCases.map((c) => ({ id: String(c.id).slice(0, 12), status: c.status, vendorId: (c.payload || {}).vendorId, vendorName: (c.payload || {}).vendorName })), null, 1));
const openN = await sql`SELECT count(*) AS n FROM staff_cases WHERE queue = 'verifications' AND status IN ('open','triaged')`;
console.log("OPEN verification cases:", openN[0].n);

// vendors with NO case at all
const noCase = await sql`
  SELECT v.id, v.name FROM vendors v
  WHERE v.verified = false
    AND NOT EXISTS (SELECT 1 FROM staff_cases sc WHERE sc.queue = 'verifications' AND (sc.payload->>'vendorId') = v.id)
  ORDER BY v.created_at DESC LIMIT 10`;
console.log("unverified vendors with NO case:", JSON.stringify(noCase, null, 1));
process.exit(0);
