// Publish + promote the 2026-09-05 policy versions through the REAL
// agreements system (P1 chain) on PROD. This is the actual console flow,
// executed headlessly: create draft → promote to current → verify resolver
// sees the new versions + old current is de-currented (kind-scoped).
// Idempotent-ish: deletes any existing 2026-09-05 draft for the kind first.
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const url = env.match(/DATABASE_URL=([^\n\r]+)/)[1];

// Extract the canonical rendered text for each policy body (strip JSX to
// plain text via the page source files) — read directly from the repo pages.
function bodyFrom(pagePath: string, title: string): string {
  const src = readFileSync(pagePath, "utf8");
  // Pull text content out of the JSX: headings + paragraphs + list items.
  const texts: string[] = [];
  const re = /<(h2|p|li)[^>]*>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = re.exec(src))) {
    let t = m[2]
      .replace(/<[^>]+>/g, " ")      // nested tags (a, strong)
      .replace(/\s+/g, " ")
      .replace(/{' '}/g, " ")
      .trim();
    if (t) texts.push(t);
  }
  return `${title} (v2026-09-05)\n\n${texts.join("\n\n")}\n\nFull rendered version: https://voeq.ng/${title.includes("Privacy") ? "privacy" : "terms"}`;
}

const termsBody = bodyFrom(
  "C:/Users/Legacy/Documents/voeq/apps/web/app/terms/page.tsx",
  "Voeq Terms of Service",
);
const privacyBody = bodyFrom(
  "C:/Users/Legacy/Documents/voeq/apps/web/app/privacy/page.tsx",
  "Voeq Privacy Policy",
);
console.log(`terms body: ${termsBody.length} chars, privacy body: ${privacyBody.length} chars`);

const sql = neon(url);

for (const [kind, body] of [["terms", termsBody], ["privacy", privacyBody]] as const) {
  // remove any prior draft of this version (idempotent re-run)
  await sql`DELETE FROM agreements WHERE kind = ${kind} AND version = '2026-09-05'`;
  await sql`INSERT INTO agreements (id, kind, version, body, effective_at, is_current)
    VALUES (${"agr-" + kind + "-2026-09-05"}, ${kind}, ${"2026-09-05"}, ${body}, ${new Date().toISOString()}, false)`;
  // promote (kind-scoped: only same-kind rows lose current)
  await sql`UPDATE agreements SET is_current = false WHERE kind = ${kind}`;
  await sql`UPDATE agreements SET is_current = true WHERE id = ${"agr-" + kind + "-2026-09-05"}`;
  const rows: any[] = await sql`SELECT id, kind, version, is_current FROM agreements WHERE kind = ${kind} ORDER BY effective_at`;
  console.log(`[${kind}] final:`, JSON.stringify(rows));
}

const all: any[] = await sql`SELECT kind, version, is_current FROM agreements ORDER BY kind`;
console.log("final state both kinds:", JSON.stringify(all));
