/** SEO PROBE — verify JSON-LD on home + listing page vs TEST DB (2026-09-10).
 *  Usage: dev server on :3031. npx tsx scripts/rt-seo-jsonld.mts
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
const iid = "seo-i-" + stamp, vid = "seo-v-" + stamp, sess = "seo-s-" + stamp;
const lid = "seo-l-" + stamp;

try {
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"seo-" + stamp + "@t.dev"}, 'SEO Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'SEO Kitchen', ${"seov" + stamp}, ${"seo-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${iid}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, status, images, is_featured, created_at, source)
    VALUES (${lid}, ${vid}, 'SEO Probe Jollof', 'Probe listing description for schema validation.', 'food', 350000, 350000, true, 'active', ${JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg"])}::jsonb, false, ${new Date().toISOString()}, null::text)`;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // HOME: Organization + WebSite schemas
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  const homeLd = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => { try { return JSON.parse(e.textContent ?? "{}"); } catch { return {}; } }));
  const hasOrg = homeLd.some((d) => d["@type"] === "Organization");
  const hasSite = homeLd.some((d) => d["@type"] === "WebSite" && d.potentialAction?.["@type"] === "SearchAction");
  check("S1: home has Organization schema", hasOrg);
  check("S2: home has WebSite + SearchAction (sitelinks searchbox)", hasSite);
  const org = homeLd.find((d) => d["@type"] === "Organization");
  check("S3: Organization carries REAL socials (IG/TikTok/WA channel)", Boolean(org?.sameAs?.some((u: string) => u.includes("instagram.com/voeq.ng")) && org?.sameAs?.some((u: string) => u.includes("whatsapp.com/channel"))));

  // LISTING: Product schema from real row
  await page.goto(`${BASE}/listing/${lid}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => document.querySelectorAll('script[type="application/ld+json"]').length >= 3,
    { timeout: 30000 },
  );
  const listLd = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => { try { return JSON.parse(e.textContent ?? "{}"); } catch { return {}; } }));
  const prod = listLd.find((d) => d["@type"] === "Product");
  check("S4: listing page has Product schema", Boolean(prod));
  check("S5: Product name = real listing title", prod?.name === "SEO Probe Jollof");
  check("S6: Offer price real (3500.00 NGN from 350000 minor)", prod?.offers?.price === "3500.00" && prod?.offers?.priceCurrency === "NGN");
  check("S7: seller = real vendor name", prod?.seller?.name === "SEO Kitchen");

  // TITLE: new brand line
  const title = await page.title();
  check("S8: <title> carries founder brand line", title.includes("Voeq"));

  await browser.close();
} finally {
  await Promise.all([
    sql`DELETE FROM listings WHERE title LIKE 'SEO Probe %'`,
    sql`DELETE FROM vendors WHERE name LIKE 'SEO %'`,
    sql`DELETE FROM sessions WHERE identity_id = ${iid}`,
    sql`DELETE FROM identities WHERE id = ${iid}`,
  ]).catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
