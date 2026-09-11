/** X3: inspect the 2 withAlert scripts — are they Flight RSC payload text
 *  (escaped data strings, inert) or executable script with alert() calls? */
import { readFileSync } from "node:fs";
const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);
const stamp = Date.now().toString(36);
const BASE = "http://localhost:3031";
const iid = "z-i-" + stamp, vid = "z-v-" + stamp, xssListing = "z-l-" + stamp;
try {
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"z-" + stamp + "@t.dev"}, 'Z Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'Z Vendor', ${"zv" + stamp}, ${"z-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  const payload = '<script>alert("xss")</script>';
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, status, images)
    VALUES (${xssListing}, ${vid}, ${payload + " Z xss listing"}, 'd', 'food', 20000, 20000, true, 'active', '[]'::jsonb)`;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let dialogFired = false;
  page.on("dialog", async (d) => { dialogFired = true; await d.dismiss(); });
  await page.goto(`${BASE}/listing/${xssListing}`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(2000);
  const detail = await page.evaluate(`(() => {
    const scripts = [...document.querySelectorAll("script:not([src])")].filter(s => (s.textContent || "").includes("alert"));
    return JSON.stringify(scripts.map(s => ({
      type: s.type || "(none)",
      len: (s.textContent || "").length,
      head: (s.textContent || "").slice(0, 150),
      isFlight: (s.textContent || "").includes("self.__next_f"),
    })));
  })()`);
  console.log("withAlert scripts detail:", detail);
  console.log("alert dialog fired:", dialogFired);
  await browser.close();
} finally {
  await Promise.all([
    sql`DELETE FROM listings WHERE id = ${xssListing}`,
    sql`DELETE FROM vendors WHERE id = ${vid}`,
    sql`DELETE FROM identities WHERE id = ${iid}`,
  ]).catch(() => {});
}
process.exit(0);
