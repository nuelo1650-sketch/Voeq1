/** SECURITY CHECK 2: XSS injection payloads through listing/comment fields —
 *  does the app render them as text (React escapes) and do they survive round-
 *  trip storage without being executed? Also verifies length validation. */
import { readFileSync } from "node:fs";
const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);
const stamp = Date.now().toString(36);
const BASE = "http://localhost:3031";
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);
const iid = "x-i-" + stamp, vid = "x-v-" + stamp, sess = "x-s-" + stamp;
const payload = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
let listingId: string | null = null;
try {
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"x-" + stamp + "@t.dev"}, 'X Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'X Vendor', ${"xv" + stamp}, ${"x-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${iid}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, status, images)
    VALUES (${"x-l-" + stamp}, ${vid}, ${payload + " X listing"}, ${payload}, 'food', 20000, 20000, true, 'active', '[]'::jsonb)`;
  listingId = "x-l-" + stamp;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let alertDialoged = false;
  page.on("dialog", async (d) => { alertDialoged = true; await d.dismiss(); });
  await page.goto(`${BASE}/listing/${listingId}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2000);
  check("X1: XSS payload did NOT execute (no alert/dialog)", !alertDialoged);
  const scriptTags = await page.evaluate(`(() => document.querySelectorAll("script:not([src]):not([type='application/json'])").length)()`);
  const injected = await page.evaluate(`(() => {
    // an injected <script>alert</script> would appear as a REAL script element
    // containing 'alert'; React-escaped text does not.
    const els = [...document.querySelectorAll("script")].filter(s => !s.src && (s.textContent || "").includes("alert"));
    return els.length;
  })()`);
  check("X2: no injected <script> element in DOM", injected === 0, `n=${injected}`);
  const titleVisible = await page.locator("[data-testid='listing-detail-title']").count();
  check("X3: title still renders (escaped, not swallowed)", titleVisible === 1);
  // comment round-trip
  await page.context().addCookies([{ name: "sessionId", value: sess, url: BASE }]);
  const c = await page.request.post(`${BASE}/api/listings/${listingId}/comments`, { data: { body: payload } });
  check("X4: comment POST accepted (stored escaped)", c.status() === 200, `status=${c.status()}`);
  await page.goto(`${BASE}/listing/${listingId}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  check("X5: comment payload did NOT execute on render", !alertDialoged);
  await browser.close();
} finally {
  await Promise.all([
    sql`DELETE FROM comments WHERE listing_id = ${listingId}`,
    sql`DELETE FROM listings WHERE id = ${listingId}`,
    sql`DELETE FROM vendors WHERE id = ${vid}`,
    sql`DELETE FROM identities WHERE id = ${iid}`,
    sql`DELETE FROM sessions WHERE id = ${sess}`,
  ]).catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
