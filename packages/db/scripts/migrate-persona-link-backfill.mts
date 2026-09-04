/**
 * Semantic fix backfill (2026-09-04, persona-link investigation).
 *
 * The demo seed wrote vendors.identity_id -> identity but left
 * identities.vendor_id NULL (one-way link). Those identities have
 * role='vendor' but no vendorId, so EVERY role-routing path bounces them:
 *   login -> /home (not /vendor/dashboard)
 *   /home -> shopper prefs gate -> /onboarding/shopper
 *   /vendor/dashboard -> redirect /onboarding/vendor
 *
 * This backfill repairs both dimensions for existing rows, on BOTH prod
 * (neondb) and test (neondb_test):
 *   1. identities.vendor_id  = vendors.id  (the missing forward link)
 *   2. consent = current terms acceptance  (demo rows were seeded consent:[])
 * Idempotent: only touches identities where vendor_id IS NULL, and only
 * adds consent when the array is empty. Re-running is a no-op.
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const PROD = env.match(/DATABASE_URL=([^\n\r]+)/)[1];
const TEST = PROD.replace("/neondb?", "/neondb_test?");
const NOW = new Date().toISOString();
const CONSENT = JSON.stringify([
  { termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: NOW, method: "email" },
]);

for (const [label, url] of [["prod", PROD], ["test", TEST]] as const) {
  const sql = neon(url);

  // 1) Backfill the forward link: identities.vendor_id
  const linked = await sql`
    UPDATE identities i
    SET vendor_id = v.id, updated_at = ${NOW}
    FROM vendors v
    WHERE v.identity_id = i.id AND i.vendor_id IS NULL
    RETURNING i.id, i.email`;
  console.log(`[${label}] vendor_id backfilled on ${linked.length} identities`);

  // 2) Consent for vendor-demo identities that have none (only ones we just
  //    linked or that already had vendor_id — i.e. genuine demo vendor rows;
  //    NEVER touch consent of identities that never accepted on purpose).
  const consented = await sql`
    UPDATE identities i
    SET consent = ${CONSENT}::jsonb, updated_at = ${NOW}
    FROM vendors v
    WHERE v.identity_id = i.id
      AND i.role = 'vendor'
      AND i.consent = '[]'::jsonb
    RETURNING i.id`;
  console.log(`[${label}] consent set on ${consented.length} demo vendor identities`);

  // Read-back verify: any role=vendor identities still without vendor_id?
  const stillBroken = await sql`
    SELECT count(*)::int AS n FROM identities i
    WHERE i.role = 'vendor' AND i.vendor_id IS NULL
      AND EXISTS (SELECT 1 FROM vendors v WHERE v.identity_id = i.id)`;
  console.log(`[${label}] role=vendor identities with a vendors row but STILL no vendor_id: ${stillBroken[0].n} (want 0)`);

  // NOTE: identities with role=vendor, no vendor_id, AND no vendors row
  // (e.g. 'Voeq Admin', 'E2E Vendor' test accounts) are NOT auto-fixed here —
  // there is no vendor to link them to. That's a different question (their
  // role should probably be 'shopper' if they never onboarded). Reported,
  // not silently mutated.
  const orphans = await sql`
    SELECT count(*)::int AS n FROM identities i
    WHERE i.role = 'vendor' AND i.vendor_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM vendors v WHERE v.identity_id = i.id)`;
  console.log(`[${label}] role=vendor with NO vendors row at all (orphans, NOT auto-fixed): ${orphans[0].n}`);
}
console.log("backfill done");
