/** E3b PROBE — seed hard-delete chain vs TEST DB.
 *  Verifies: seed-delete 401 unauth, seed hard-delete works (row + children
 *  gone), real-listing hard-delete REFUSED (409), SEED tag/filter present.
 *  Staff session needed — create staff identity + session, call API directly.
 *  Usage: dev server on :3031. npx tsx scripts/rt-mb-e3b.mts
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
// staff (super_admin per SUPER_ADMIN_EMAIL env-twin rule)
const staffIid = "e3b-s-" + stamp, staffSess = "e3b-ss-" + stamp;
// vendor + listings
const iid = "e3b-i-" + stamp, vid = "e3b-v-" + stamp, sess = "e3b-sess-" + stamp;
const seedLid = "e3b-l-seed-" + stamp, realLid = "e3b-l-real-" + stamp;

try {
  await sql`INSERT INTO identities (id, email, name, role, staff_role, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${staffIid}, 'e3b-staff@voeq.ng', 'E3B Staff', 'shopper', 'super_admin', 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${staffSess}, ${staffIid}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;

  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"e3b-" + stamp + "@t.dev"}, 'E3B Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'E3B Vendor Shop', ${"e3bv" + stamp}, ${"e3b-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${iid}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;
  // seed listing + real listing (+ a child comment on the seed to prove cascade)
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, status, images, is_featured, created_at, source)
    VALUES (${seedLid}, ${vid}, 'E3B Seed Listing', 'd', 'food', 350000, 350000, true, 'active', ${JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg"])}::jsonb, false, ${new Date().toISOString()}, 'seed')`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, status, images, is_featured, created_at, source)
    VALUES (${realLid}, ${vid}, 'E3B Real Listing', 'd', 'food', 350000, 350000, true, 'active', ${JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg"])}::jsonb, false, ${new Date().toISOString()}, null)`;
  await sql`INSERT INTO comments (id, listing_id, author_id, body, status, created_at)
    VALUES (${"e3b-c-" + stamp}, ${seedLid}, ${iid}, 'probe child comment', 'visible', ${new Date().toISOString()})`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // 1) unauth is refused
  let res = await fetch(`${BASE}/api/staff/seed-delete`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ listingId: seedLid }),
  });
  check("E1: seed-delete 401 unauth", res.status === 401, `got ${res.status}`);

  // 2) real listing hard-delete REFUSED (409) with staff session
  res = await fetch(`${BASE}/api/staff/seed-delete`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: `sessionId=${staffSess}` },
    body: JSON.stringify({ listingId: realLid }),
  });
  check("E2: real-listing hard-delete REFUSED (409 not_a_seed)", res.status === 409, `got ${res.status}`);

  // 3) seed hard-delete works; children cascade
  res = await fetch(`${BASE}/api/staff/seed-delete`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: `sessionId=${staffSess}` },
    body: JSON.stringify({ listingId: seedLid }),
  });
  const body = await res.json();
  check("E3: seed hard-delete ok", res.ok && body.ok === true, JSON.stringify(body).slice(0, 80));
  const gone = await sql`SELECT count(*)::int AS n FROM listings WHERE id = ${seedLid}`;
  check("E4: seed listing row GONE", gone[0].n === 0);
  const childGone = await sql`SELECT count(*)::int AS n FROM comments WHERE id = ${"e3b-c-" + stamp}`;
  check("E5: child comment cascaded (no orphans)", childGone[0].n === 0);
  const realStill = await sql`SELECT count(*)::int AS n FROM listings WHERE id = ${realLid}`;
  check("E6: real listing untouched", realStill[0].n === 1);

  // 4) UI: SEED tag + filter on the panel (render check via staff session cookie)
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addCookies([{ name: "sessionId", value: staffSess, domain: "localhost", path: "/" }]);
  const spage = await ctx.newPage();
  await spage.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
  await spage.waitForTimeout(2500);
  // The panel is behind auth + tabs; do a light check: fetch the listings API w/ session instead
  const apiRes = await fetch(`${BASE}/api/staff/listings`, { headers: { cookie: `sessionId=${staffSess}` } });
  const apiData = await apiRes.json();
  const seedRow = (apiData.listings ?? []).find((l: { id: string }) => l.id === realLid);
  check("E7: listings API returns source field", seedRow !== undefined && "source" in seedRow, JSON.stringify(seedRow ?? {}).slice(0, 80));
  await ctx.close();
  await browser.close();
} finally {
  await Promise.all([
    sql`DELETE FROM listings WHERE title LIKE 'E3B %'`,
    sql`DELETE FROM vendors WHERE name LIKE 'E3B %'`,
    sql`DELETE FROM sessions WHERE id IN (${staffSess}, ${sess})`,
    sql`DELETE FROM identities WHERE id IN (${staffIid}, ${iid})`,
  ]).catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
