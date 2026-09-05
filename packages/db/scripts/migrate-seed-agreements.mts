// Config console P1: seed the agreements table with the CURRENT terms +
// privacy rows (kind-scoped isCurrent). Prod table is EMPTY today (verified
// via probe) — the config console's Agreements section would manage a void,
// and resolveCurrentAgreementVersions() would always hit its constant
// fallback. Version = "2026-08-01" to match the versions stamped in every
// existing identity's consent history (backward compatible by design).
// Idempotent: skips insert if a current row for the kind already exists.
// Same pattern as migrate-categories-active.mts: prod + test, additive only.
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
if (!m) { console.error("no DATABASE_URL"); process.exit(1); }

// The real, canonical policy text (bodies intentionally short here — the
// public /terms + /privacy pages hold the full rendered text; these rows are
// the VERSIONING source of truth for consent, not a CMS).
const SEEDS = [
  {
    kind: "terms",
    id: "agr-terms-2026-08-01",
    version: "2026-08-01",
    body: "Voeq Terms of Service (v2026-08-01). Full text: https://voeq.ng/terms",
  },
  {
    kind: "privacy",
    id: "agr-privacy-2026-08-01",
    version: "2026-08-01",
    body: "Voeq Privacy Policy (v2026-08-01). Full text: https://voeq.ng/privacy",
  },
];

async function migrate(url: string, label: string) {
  const sql = neon(url);
  for (const seed of SEEDS) {
    const existing: any[] = await sql`SELECT id FROM agreements WHERE kind = ${seed.kind} AND is_current = true`;
    if (existing.length > 0) {
      console.log(`[${label}] ${seed.kind}: current row already exists (${existing[0].id}) — skipped`);
      continue;
    }
    await sql`INSERT INTO agreements (id, kind, version, body, effective_at, is_current)
      VALUES (${seed.id}, ${seed.kind}, ${seed.version}, ${seed.body}, ${new Date().toISOString()}, true)`;
    console.log(`[${label}] ${seed.kind}: seeded ${seed.id} as current`);
  }
  const rows: any[] = await sql`SELECT kind, version, is_current FROM agreements ORDER BY kind`;
  console.log(`[${label}] final state:`, JSON.stringify(rows));
}

await migrate(m[1], "prod");
await migrate(m[1].replace(/\/neondb(\?|$)/, "/neondb_test$1"), "test");
console.log("done");
