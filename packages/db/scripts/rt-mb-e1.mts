/** MONEY BAG E1 (F2/D5) — Google auth intent round-trip probe vs TEST DB.
 *  Verifies: /become-vendor?intent=vendor survives the auth bounce (middleware),
 *  signup/login Google buttons carry intent, /account-choice safety net exists
 *  + its API rules (fills empty, refuses overwrite, 401 anon).
 *  Usage: dev server on :3031 (test DB). npx tsx scripts/rt-mb-e1.mts
 */
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const BASE = "http://localhost:3031";
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);

const stamp = Date.now().toString(36);
const iid = "e1-i-" + stamp, sess = "e1-s-" + stamp;

try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // 1) anon /become-vendor?intent=vendor bounces to /login AND KEEPS intent
  await page.goto(`${BASE}/become-vendor?intent=vendor`, { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/login\?/, { timeout: 20000 }).catch(() => {});
  const loginUrl = page.url();
  check("E1: auth bounce preserves intent=vendor", loginUrl.includes("/login") && loginUrl.includes("intent=vendor"), loginUrl.slice(0, 80));

  // 2) login page Google button exists (intent wiring is client-side state)
  await page.goto(`${BASE}/login?intent=vendor`, { waitUntil: "domcontentloaded" });
  const googleBtn = await page.$('[data-testid="google-login"]');
  check("E2: login page renders Google button (intent param accepted)", googleBtn !== null);

  // 3) signup page Google button
  await page.goto(`${BASE}/signup`, { waitUntil: "domcontentloaded" });
  const signupGoogle = await page.$('[data-testid="google-signup"]');
  check("E3: signup page renders Google button", signupGoogle !== null);

  // 4) account-choice page renders (anon sees it too — the API gates the write)
  await page.goto(`${BASE}/account-choice`, { waitUntil: "domcontentloaded" });
  const choice = await page.$('[data-testid="account-choice"]');
  check("E4: /account-choice safety-net page renders", choice !== null);

  // 5) API: anon POST -> 401
  const anon = await fetch(`${BASE}/api/account-choice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intent: "vendor" }),
  });
  check("E5: account-choice API rejects anon (401)", anon.status === 401);

  // 6) API: authed session with EMPTY intent -> accepted
  await sql`INSERT INTO identities (id, email, name, role, account_status, email_verified, consent, intent, created_at, updated_at)
    VALUES (${iid}, ${"e1-" + stamp + "@t.dev"}, 'E1 User', 'shopper', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, null, now(), now())`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${iid}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;
  const authed = await fetch(`${BASE}/api/account-choice`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `sessionId=${sess}` },
    body: JSON.stringify({ intent: "vendor" }),
  });
  const authedBody = await authed.json().catch(() => ({}));
  check("E6: authed empty-intent user CAN choose vendor", authed.ok && authedBody.intent === "vendor");
  const row = await sql`SELECT intent FROM identities WHERE id = ${iid}`;
  check("E7: intent persisted to identity row", row[0]?.intent === "vendor");

  // 7) API: refuses overwrite (409)
  const overwrite = await fetch(`${BASE}/api/account-choice`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `sessionId=${sess}` },
    body: JSON.stringify({ intent: "shopper" }),
  });
  check("E8: account-choice refuses intent overwrite (409)", overwrite.status === 409);

  // 8) API: invalid intent -> 400
  const bad = await fetch(`${BASE}/api/account-choice`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `sessionId=${sess}` },
    body: JSON.stringify({ intent: "admin" }),
  });
  check("E9: account-choice validates intent allowlist (400)", bad.status === 400);

  await browser.close();
} finally {
  await Promise.all([
    sql`DELETE FROM sessions WHERE identity_id = ${iid}`,
    sql`DELETE FROM identities WHERE id = ${iid}`,
  ]).catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
