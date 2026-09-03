/**
 * Seed the canonical dev vendor `v1` into the TEST DB (idempotent).
 * The /api/dev/vendor-session route defaults to vendorId "v1" and
 * /api/conversations requires vendor.identityId — any HTTP test that
 * messages a vendor depends on this row surviving a test-DB reset.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = readFileSync(new URL("../../../apps/web/.env.local", import.meta.url), "utf8");
const raw = env.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim().replace(/^"|"$/g, "");
if (!raw) throw new Error("no DATABASE_URL");
const url = raw.replace("/neondb?", "/neondb_test?");
const sql = neon(url);

const existing = await sql`SELECT identity_id FROM vendors WHERE id = 'v1'`;
if (existing.length > 0) {
  console.log("v1 already exists, identity_id =", existing[0].identity_id);
} else {
  await sql`
    INSERT INTO vendors (id, identity_id, name, handle, slug, campus, status, category_ids, description)
    VALUES (
      'v1', NULL,
      'Demo: V1 Harness Vendor', 'v1-harness', 'v1-harness', 'nmu-okerenkoko', 'live',
      '{}', 'Seeded fixture for the dev vendor-session harness (T5 export test).'
    )
  `;
  console.log("v1 seeded (identity_id NULL — vendor-session route patches it on first use)");
}
const check = await sql`SELECT id, name, status FROM vendors WHERE id = 'v1'`;
console.log("read-back:", JSON.stringify(check));
