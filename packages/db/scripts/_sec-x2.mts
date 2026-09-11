/** X2 disambiguation: are those 2 inline scripts Next.js hydration payloads
 *  (selfProposedEarlyCompletion etc) or USER-INJECTED script content? Compare
 *  a CLEAN listing page vs the XSS listing page. */
import { readFileSync } from "node:fs";
const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);
const stamp = Date.now().toString(36);
const BASE = "http://localhost:3031";
const iid = "y-i-" + stamp, vid = "y-v-" + stamp;
const cleanListing = "y-l-" + stamp, xssListing = "y-xl-" + stamp;
try {
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"y-" + stamp + "@t.dev"}, 'Y Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'Y Vendor', ${"yv" + stamp}, ${"y-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  const payload = '<script>alert("xss")</script>';
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, status, images)
    VALUES (${cleanListing}, ${vid}, 'Y clean listing', 'd', 'food', 20000, 20000, true, 'active', '[]'::jsonb)`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, status, images)
    VALUES (${xssListing}, ${vid}, ${payload + " Y xss listing"}, 'd', 'food', 20000, 20000, true, 'active', '[]'::jsonb)`;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const count = async (url: string) => {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(1200);
    return page.evaluate(`(() => JSON.stringify({
      inline: [...document.querySelectorAll("script:not([src])")].length,
      withAlert: [...document.querySelectorAll("script:not([src])")].filter(s => (s.textContent || "").includes("alert")).length,
      nextHydration: [...document.querySelectorAll("script:not([src])")].filter(s => (s.textContent || "").includes("self.__next_f")).length,
    }))()`);
  };
  const clean = JSON.parse(await count(`${BASE}/listing/${cleanListing}`));
  const xss = JSON.parse(await count(`${BASE}/listing/${xssListing}`));
  console.log("clean page:", JSON.stringify(clean));
  console.log("xss page:  ", JSON.stringify(xss));
  const verdict = clean.withAlert === 0 && xss.withAlert === 0;
  console.log(verdict ? "VERDICT: both 0 — the 2 inline scripts are Next.js hydration payloads, NOT user injection" : "VERDICT: real injection detected");
  await browser.close();
} finally {
  await Promise.all([
    sql`DELETE FROM listings WHERE id IN (${cleanListing}, ${xssListing})`,
    sql`DELETE FROM vendors WHERE id = ${vid}`,
    sql`DELETE FROM identities WHERE id = ${iid}`,
  ]).catch(() => {});
}
process.exit(0);
