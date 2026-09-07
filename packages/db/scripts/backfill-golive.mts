/**
 * PUBLISH=GO-LIVE BACKFILL (2026-09-07, founder: "we already have vendors so
 * be careful and help them"): vendors created before publish=go-live may be
 * stuck in pending_listings WITH a signed agreement + published listings —
 * invisible in Explore through no fault of their own.
 *
 * CAREFUL rules (founder: "be careful"):
 *  - ONLY promote vendors with agreementAcceptedAt AND >=1 published+active
 *    listing (the exact postconditions of the new publish=go-live path).
 *  - NEVER touch suspended vendors. NEVER promote without both preconditions.
 *  - Dry-run by default; pass --apply to write.
 *  - Widens each promoted identity's role to "vendor" (same as goLive()).
 *
 * Usage: npx tsx scripts/backfill-golive.mts [--apply]
 */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1];
const apply = process.argv.includes("--apply");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const candidates = await sql`
  SELECT v.id, v.name, v.status, v.identity_id, v.agreement_accepted_at,
         (SELECT count(*) FROM listings l WHERE l.vendor_id = v.id AND l.is_published = true AND l.status = 'active') AS pub_count
  FROM vendors v
  WHERE v.status = 'pending_listings'
    AND v.agreement_accepted_at IS NOT NULL
    AND (SELECT count(*) FROM listings l WHERE l.vendor_id = v.id AND l.is_published = true AND l.status = 'active') > 0
`;
console.log(`candidates: ${candidates.length}`);
for (const c of candidates) {
  console.log(`  ${apply ? "PROMOTING" : "would promote"} ${c.id} "${c.name}" (pub listings: ${c.pub_count})`);
}
if (!apply) {
  console.log("DRY RUN — re-run with --apply to promote.");
  process.exit(0);
}
for (const c of candidates) {
  await sql`UPDATE vendors SET status = 'live' WHERE id = ${c.id}`;
  if (c.identity_id) {
    // identities DOES have updated_at (vendors doesn't).
    await sql`UPDATE identities SET role = 'vendor', updated_at = ${new Date().toISOString()} WHERE id = ${c.identity_id} AND role = 'shopper'`;
  }
  console.log("promoted:", c.id, c.name);
}
const after = await sql`
  SELECT count(*) AS n FROM vendors v
  WHERE v.status = 'pending_listings' AND v.agreement_accepted_at IS NOT NULL
    AND (SELECT count(*) FROM listings l WHERE l.vendor_id = v.id AND l.is_published = true AND l.status = 'active') > 0`;
console.log("remaining stuck:", after[0].n);
process.exit(0);
