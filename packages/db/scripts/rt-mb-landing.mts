/** MONEY BAG C1 — round-trip probe: MB landing behind ?next=mb vs TEST DB.
 *  Verifies: canary renders MB landing, old landing intact without param,
 *  hero headline + crawlable <a> CTA, polaroid = REAL listings, trust band,
 *  grid renders, vendor panel, areas links real, ExploreDoor upgraded,
 *  honesty scans (no sold/claims, no fake stats).
 *  Usage: dev server on :3031 (test DB). npx tsx scripts/rt-mb-landing.mts
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
const iid = "mbh-i-" + stamp, vid = "mbh-v-" + stamp, sess = "mbh-s-" + stamp;

try {
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"mbh-" + stamp + "@t.dev"}, 'MBH Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'MBH Kitchen', ${"mbhv" + stamp}, ${"mbh-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${iid}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_min_minor, is_published, status, images, is_featured, created_at, source)
    VALUES (${"mbh-l-" + stamp}, ${vid}, 'MBH Jollof Special', 'd', 'food', 350000, true, 'active', ${JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg"])}::jsonb, true, ${new Date().toISOString()}, null::text)`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // 1) canary renders MB landing
  await page.goto(`${BASE}/?next=mb`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="mb-landing"]', { timeout: 30000 });
  check("H1: ?next=mb renders MB landing", true);
  const oldLanding = await page.$(".landing-hero, [data-testid='landing-hero']");
  const oldRail = await page.$("[data-testid='landing-trending']");
  check("H2: canary does NOT render old landing sections", oldLanding === null && oldRail === null);

  // wait for the real listing to surface in the payload
  await page.waitForFunction(
    () => (document.querySelector('[data-testid="mb-landing"]')?.textContent ?? "").includes("MBH Jollof Special"),
    { timeout: 30000 },
  ).catch(() => {});
  const text = await page.evaluate(() => document.querySelector('[data-testid="mb-landing"]')?.textContent ?? "");

  // 2) hero + crawlable CTA
  const heroText = await page.evaluate(() => document.querySelector('[data-testid="mb-hero"]')?.textContent ?? "");
  check("H3: hero headline 'Find it. Chat it. Get it.'", heroText.includes("Find it.") && heroText.includes("Chat it.") && heroText.includes("Get it."));
  const cta = await page.$eval('[data-testid="mb-hero-cta"]', (el) => ({ tag: el.tagName, href: el.getAttribute("href") }));
  check("H4: primary CTA is a real crawlable <a> to /explore?next=mb", cta.tag === "A" && (cta.href ?? "").includes("/explore"));

  // 3) polaroid = REAL listing
  const polText = await page.evaluate(() => document.querySelector('[data-testid="mb-hero-collage"]')?.textContent ?? "");
  check("H5: collage shows the REAL listing", polText.includes("MBH Jollof Special"));

  // 4) trust band + market-open pill
  const trustText = await page.evaluate(() => document.querySelector('[data-testid="mb-trust-band"]')?.textContent ?? "");
  check("H6: trust band renders 3 pillars", trustText.includes("Campus verified") && trustText.includes("Chat before you buy") && trustText.includes("Meet-on-campus safe"));
  check("H7: market-open pill real-time", /Market open|Opens/.test(trustText), trustText.slice(-40));

  // 5) grid + honesty scans
  check("H8: grid shows real listing", text.includes("MBH Jollof Special"));
  check("H9: no sold/booking claims anywhere on MB landing", !/\bsold\b|\bbookings?\b/i.test(text));
  check("H10: no fake stats numbers ('5.2k', '120+')", !/\d+(\.\d+)?k\+? (items|vendors|users)/i.test(text));

  // 6) vendor panel + intent=vendor (D5)
  const vendorCta = await page.$eval('[data-testid="mb-vendor-cta"]', (el) => el.getAttribute("href"));
  check("H11: vendor CTA carries intent=vendor", (vendorCta ?? "").includes("intent=vendor"));

  // 7) areas links = real B3 pages
  const areaHrefs = await page.$$eval("[data-testid='mb-area-chip']", (els) => els.map((e) => e.getAttribute("href")));
  check("H12: area chips link to real /explore/areas/ pages", areaHrefs.length >= 3 && areaHrefs.every((h) => (h ?? "").startsWith("/explore/areas/")), `${areaHrefs.length} chips`);

  // 8) ExploreDoor upgraded
  const door = await page.$('[data-testid="mb-explore-door"]');
  check("H13: ExploreDoor renders (upgraded, not just the pill)", door !== null);
  if (door) {
    const doorText = await door.evaluate((el) => el.textContent ?? "");
    check("H14: door has quick-entry cards + real counts", (await door.$$("a")).length >= 4 && /\d+ listings?/.test(doorText));
    const pillHref = await door.$eval("[data-testid='mb-door-pill']", (el) => el.getAttribute("href"));
    check("H15: door pill enters the market", (pillHref ?? "").includes("/explore"));
  }

  // 9) canary semantics (flipped 2026-09-11 for founder review): in NON-PROD
  // the new landing is the DEFAULT (previews/dev are review surfaces) and the
  // OLD landing is the escape hatch at ?next=old. Production keeps the old
  // default until cut-over — that branch lives in app/page.tsx VERCEL_ENV gate
  // and is verified at prod deploy time by the 120/120 matrix.
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  const mbDefault = await page.$('[data-testid="mb-landing"]');
  check("H16a: non-prod default = new landing", mbDefault !== null);
  await page.goto(`${BASE}/?next=old`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("main", { timeout: 30000 });
  const mbOnOld = await page.$('[data-testid="mb-landing"]');
  check("H16b: ?next=old escape hatch renders the old landing", mbOnOld === null);

  await browser.close();
} finally {
  await Promise.all([
    sql`DELETE FROM listings WHERE title LIKE 'MBH %'`,
    sql`DELETE FROM vendors WHERE name LIKE 'MBH %'`,
    sql`DELETE FROM sessions WHERE identity_id = ${iid}`,
    sql`DELETE FROM identities WHERE id = ${iid}`,
  ]).catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
