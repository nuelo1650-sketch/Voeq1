/** Verify niche categories render: create wizard dropdown + explore filter
 *  source (server-resolved taxonomy) — against TEST DB after backfill. */
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
process.env.DATABASE_URL = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const { chromium: _c } = { chromium: null as any };
const b = await (await import("playwright")).chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });

// The create-listing page resolves categories server-side; it needs a vendor
// session. Seed one.
const stamp = Date.now().toString(36);
const iid = "nc-i-" + stamp, vid = "nc-v-" + stamp, sess = "nc-s-" + stamp;
await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
  VALUES (${iid}, ${"nc-" + stamp + "@t.dev"}, 'NC Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
    ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
  VALUES (${vid}, ${iid}, 'NC Vendor', ${"nc" + stamp}, ${"nc-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${iid}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;

const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);
try {
  await p.context().addCookies([{ name: "sessionId", value: sess, url: "http://localhost:3031" }]);
  await p.goto("http://localhost:3031/vendor/listings/create", { waitUntil: "domcontentloaded", timeout: 90000 });
  await p.waitForTimeout(1500);
  const opts = await p.evaluate(`(() => {
    const sel = document.querySelector("select");
    if (!sel) return "no-select";
    return [...sel.options].map((o) => o.textContent?.trim());
  })()`);
  const list = typeof opts === "string" ? [] : (opts as string[]);
  check("N1: Pastries & Bakes in the dropdown", list.includes("Pastries & Bakes"), list.join("|").slice(0, 120));
  check("N2: Hair Services in the dropdown", list.includes("Hair Services"));
  check("N3: Other still last (fallback preserved)", list[list.length - 1] === "Other");
  check("N4: dropdown grew to 28+1", list.length >= 28, `n=${list.length}`);
} catch (e) {
  results.push("FAIL exception — " + String(e).slice(0, 200));
} finally {
  await sql`DELETE FROM sessions WHERE id = ${sess}`;
  await sql`DELETE FROM vendors WHERE id = ${vid}`;
  await sql`DELETE FROM identities WHERE id = ${iid}`;
}
await b.close();
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
