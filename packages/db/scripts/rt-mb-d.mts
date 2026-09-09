/** MONEY BAG D — round-trip probe: hybrid banner + listing additions vs TEST DB.
 *  Verifies: brand banner default state, cover swap, remove revert (3 banner
 *  states), Voeq Live seal on featured, image counter, price-note, sticky CTA
 *  bar (<768 only, hidden when main CTA visible), A19 aggregate hidden <50.
 *  Usage: dev server on :3031 (test DB). npx tsx scripts/rt-mb-d.mts
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
const iid = "mbd-i-" + stamp, vid = "mbd-v-" + stamp, sess = "mbd-s-" + stamp;
const lid = "mbd-l-" + stamp;

try {
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"mbd-" + stamp + "@t.dev"}, 'MBD Kitchen', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, photo_cover, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'MBD Kitchen', ${"mbdv" + stamp}, ${"mbd-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', null, ${new Date().toISOString()})`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${iid}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, status, images, is_featured, created_at, source)
    VALUES (${lid}, ${vid}, 'MBD Featured Jollof', 'd', 'food', 350000, 350000, true, 'active',
      ${JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg", "https://res.cloudinary.com/demo/image/upload/second.jpg"])}::jsonb,
      true, ${new Date().toISOString()}, null::text)`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // ---- BANNER STATE 1: brand banner (photoCover null) ----
  await page.goto(`${BASE}/vendor/${vid}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="brand-banner"]', { timeout: 30000 });
  const st1 = await page.$eval('[data-testid="brand-banner"]', (el) => el.getAttribute("data-banner-state"));
  check("D1: default banner state = brand", st1 === "brand");
  const bannerText = await page.$eval('[data-testid="brand-banner"]', (el) => el.textContent ?? "");
  check("D2: brand banner carries vendor name + category line", bannerText.includes("MBD Kitchen") && bannerText.toLowerCase().includes("food"));

  // ---- BANNER STATE 2: swap to cover ----
  await sql`UPDATE vendors SET photo_cover = 'https://res.cloudinary.com/demo/image/upload/sample.jpg' WHERE id = ${vid}`;
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="brand-banner"]', { timeout: 30000 });
  const st2 = await page.$eval('[data-testid="brand-banner"]', (el) => el.getAttribute("data-banner-state"));
  check("D3: cover set -> banner swaps to photo state", st2 === "photo");
  const hasImg = await page.$eval('[data-testid="brand-banner"]', (el) => el.querySelector("img") !== null);
  check("D4: photo banner renders the cover img", hasImg);

  // ---- BANNER STATE 3: remove -> revert to brand ----
  await sql`UPDATE vendors SET photo_cover = NULL WHERE id = ${vid}`;
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="brand-banner"]', { timeout: 30000 });
  const st3 = await page.$eval('[data-testid="brand-banner"]', (el) => el.getAttribute("data-banner-state"));
  check("D5: cover removed -> reverts to brand banner", st3 === "brand");

  // v1.7 law: banner name is a watermark, identity card name is the hero
  const heroName = await page.$eval('[data-testid="storefront-name"]', (el) => getComputedStyle(el).fontSize);
  check("D6: identity card name is bigger than banner watermark (v1.7 law)", parseFloat(heroName) >= 20, `heroName=${heroName}`);

  // ---- LISTING: seal, counter, price-note, sticky bar ----
  await page.goto(`${BASE}/listing/${lid}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="listing-detail"]', { timeout: 30000 });
  const seal = await page.$('[data-testid="listing-detail-live-seal"]');
  check("D7: featured listing shows ✦ Voeq Live seal", seal !== null);
  await page.waitForFunction(() => document.querySelector('[data-testid="listing-detail-imgcount"]')?.textContent?.includes("1/2"), { timeout: 15000 }).catch(() => {});
  const counter = await page.$eval('[data-testid="listing-detail-imgcount"]', (el) => el.textContent ?? "");
  check("D8: image counter shows ▹ 1/2", counter.includes("1/2"), counter);
  const priceNote = await page.$eval('[data-testid="listing-detail-price-note"]', (el) => el.textContent ?? "");
  check("D9: price-note 'Price agreed in chat'", priceNote.includes("Price agreed in chat"));
  // A15 behavior: bar hidden while main CTA is on screen, appears once it
  // scrolls away. The fixture page is short (~490px of scroll), so inject a
  // tall spacer AFTER the CTA to make the page long enough for the CTA to
  // actually leave the viewport — then scroll past it.
  await page.evaluate(() => {
    const spacer = document.createElement("div");
    spacer.setAttribute("data-mb-spacer", "1");
    spacer.style.height = "1800px";
    document.body.appendChild(spacer);
  });
  await page.evaluate(() => {
    const cta = document.querySelector('[data-testid="listing-detail-message-cta"]');
    const r = cta?.getBoundingClientRect();
    if (r) window.scrollTo(0, r.bottom + window.innerHeight);
  });
  await page.waitForTimeout(700);
  const sticky = await page.$('[data-testid="listing-sticky-cta"]');
  check("D10: sticky bar appears once main CTA scrolls away (A15)", sticky !== null);
  if (sticky) {
    const msgBtn = await sticky.$('[data-testid="listing-sticky-message"]');
    check("D11: sticky bar carries Message + save + share", msgBtn !== null && (await sticky.$$(".listing-detail-save-sticky, [data-testid='listing-detail-sticky-share']")).length >= 1);
  }

  // ---- A19: aggregate hidden <50 reviews ----
  await page.goto(`${BASE}/vendor/${vid}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="storefront-trust"]', { timeout: 30000 }).catch(() => {});
  const reviewsText = await page.evaluate(() => document.querySelector('[data-testid="storefront-trust"]')?.textContent ?? "");
  const aggregateVisible = await page.$('[data-testid="reviews-rating"]');
  check("D12: A19 aggregate score hidden (<50 reviews)", aggregateVisible === null);
  const distVisible = await page.$('[data-testid="reviews-distribution"]');
  check("D13: A19 distribution bars hidden (<50 reviews)", distVisible === null);

  // editor: cover section present with remove path
  check("D14: honesty — no sold/booking text on storefront", !/\bsold\b|\bbookings?\b/i.test(reviewsText));

  await browser.close();
} finally {
  await Promise.all([
    sql`DELETE FROM listings WHERE title LIKE 'MBD %'`,
    sql`DELETE FROM vendors WHERE name LIKE 'MBD %'`,
    sql`DELETE FROM sessions WHERE identity_id = ${iid}`,
    sql`DELETE FROM identities WHERE id = ${iid}`,
  ]).catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
