/** BACKFILL (dry-run by default): vendors who went LIVE via publish=go-live
 *  never got a verifications staff_cases row (the case producer only lived in
 *  the manual go-live route). Insert the missing cases so admin can see them.
 *  INSERTS ONLY — never touches vendor/listing data. Idempotent.
 *  Usage: npx tsx scripts/backfill-golive-cases.mts [--apply]
 */
import { readFileSync } from "node:fs";

const apply = process.argv.includes("--apply");
const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const prodUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1]; // PROD (no _test suffix)
process.env.DATABASE_URL = prodUrl;

const { neon } = await import("@neondatabase/serverless");
const sql = neon(prodUrl);

// Live vendors who have NO verification case at all (open or resolved —
// resolved ones were handled by staff already; only fully-missing ones).
// (vendors table has no created_at; order by identities.created_at joinless —
// simple natural order is fine, this is a backfill.)
const missing = await sql`
  SELECT v.id, v.name, v.description
  FROM vendors v
  WHERE v.status = 'live'
    AND NOT EXISTS (
      SELECT 1 FROM staff_cases c
      WHERE c.queue = 'verifications'
        AND c.payload->>'vendorId' = v.id
    )
  ORDER BY v.name
`;

console.log(`vendors live without any verification case: ${missing.length}`);
if (!apply) {
  for (const v of missing.slice(0, 25)) console.log(`  - ${v.name} (${v.id.slice(0, 12)}…) created ${v.created_at?.toISOString?.() ?? v.created_at}`);
  console.log("DRY RUN — pass --apply to insert cases.");
  process.exit(0);
}

let inserted = 0;
for (const v of missing) {
  try {
    await sql`
      INSERT INTO staff_cases (id, queue, decision, consequence, payload, status, created_at)
      VALUES (
        ${"vc-" + Date.now().toString(36) + "-" + inserted.toString(36)},
        'verifications',
        'pending_verification',
        NULL,
        ${JSON.stringify({ vendorId: v.id, vendorName: v.name, description: v.description })}::jsonb,
        'open',
        now()
      )`;
    inserted++;
  } catch (e) {
    console.error(`  FAILED ${v.name}: ${e instanceof Error ? e.message : e}`);
  }
}
console.log(`inserted ${inserted} verification cases`);
const after = await sql`
  SELECT COUNT(*)::int AS n FROM vendors v
  WHERE v.status = 'live' AND NOT EXISTS (
    SELECT 1 FROM staff_cases c WHERE c.queue = 'verifications' AND c.payload->>'vendorId' = v.id
  )
`;
console.log(`remaining live vendors without case: ${after[0].n}`);
process.exit(0);
