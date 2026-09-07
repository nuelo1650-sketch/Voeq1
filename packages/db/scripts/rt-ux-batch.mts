/**
 * UX-BATCH round-trip vs TEST DB + live dev:
 * A: storefront hero shows the LEDE (first sentence), NOT the full description
 *    twice; stats row shows no 'Verified listings' stat.
 * B: preview banner v2 renders 'Viewing as shopper' + Store icon + no Eye/
 *    eyeball glyph; edit links + exit present.
 * C: analytics insights render from real seeded page_events (dead-listing
 *    insight + best-day insight) + listing health table with the
 *    needs-attention flag on the zero-view listing.
 * D: 'Keep me signed in' verified separately (rt-remember-me) — not repeated.
 * Seeds throwaway vendor/identity/session + listings + page_events; self-cleans.
 */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const stamp = Date.now().toString(36);
const idId = "ux-i-" + stamp;
const vendorId = "ux-v-" + stamp;
const sessId = "ux-s-" + stamp;
const hotId = "ux-hot-" + stamp;
const deadId = "ux-dead-" + stamp;
const results: string[] = [];
const check = (name: string, ok: boolean, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
const BASE = "http://localhost:3031";

try {
  const desc = "Hot jollof rice served fresh every evening. We also do party packs and small chops for birthdays and hostel events.";
  await sql`INSERT INTO identities (id, email, name, role, staff_role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${idId}, ${"ux-" + stamp + "@voeq-test.example"}, 'UX Vendor', 'vendor', NULL, ${vendorId}, 'nmu-okerenkoko', 'active', true, '[]'::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description)
    VALUES (${vendorId}, ${idId}, 'UX Vendor', ${"ux" + stamp}, ${"ux-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, ${desc})`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, is_featured, status, images)
    VALUES (${hotId}, ${vendorId}, 'Hot Jollof Plate', 'Best on campus.', 'food', 150000, 150000, true, false, 'published', '[]'::jsonb)`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, is_featured, status, images)
    VALUES (${deadId}, ${vendorId}, 'Stale Snack Pack', 'Nobody looked.', 'food', 90000, 90000, true, false, 'published', '[]'::jsonb)`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at)
    VALUES (${sessId}, ${idId}, now() + interval '2 hours', now())`;
  // page_events: hot listing viewed 6x, storefront 4x across two days (best-day + leader insight)
  for (let i = 0; i < 6; i++) {
    await sql`INSERT INTO page_events (id, identity_id, type, ref_id, path, at)
      VALUES (${"ux-pe-" + stamp + "-" + i}, NULL, 'listing_view', ${hotId}, ${"/listing/" + hotId}, now()::text)`;
  }
  for (let i = 0; i < 4; i++) {
    await sql`INSERT INTO page_events (id, identity_id, type, ref_id, path, at)
      VALUES (${"ux-ps-" + stamp + "-" + i}, NULL, 'storefront_view', ${vendorId}, ${"/vendor/" + vendorId}, now()::text)`;
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.context().addCookies([{ name: "sessionId", value: sessId, url: BASE }]);

  // ---- A: storefront S1 "goods first" header ----
  await page.goto(`${BASE}/vendor/${vendorId}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("[data-testid='storefront-hero']", { timeout: 30000 });
  // S1 (2026-09-06): the About card is retired — the hero carries the FULL
  // description ONCE (storefront-about rides the .vs-desc element).
  const heroDesc = (await page.locator(".vs-desc").textContent()) ?? "";
  check("A1: hero shows FULL description once", heroDesc.includes("Hot jollof rice served fresh every evening.") && heroDesc.includes("party packs"), JSON.stringify(heroDesc.slice(0, 60)));
  const aboutCount = await page.locator("[data-testid='storefront-about']").count();
  check("A2: no duplicate About card (single description)", aboutCount === 1, `count: ${aboutCount}`);
  const verifiedStat = await page.locator("[data-testid='storefront-stats']").locator("text=Verified").count();
  check("A3: 'Verified listings' stat removed", verifiedStat === 0, `count: ${verifiedStat}`);
  // S1: category pills show NAMES not raw ids; statbar has 3 honest cells.
  const catPill = (await page.locator(".vs-cat-badge").first().textContent()) ?? "";
  check("A4: category pill shows NAME not id", catPill.length > 0 && catPill !== catPill.toLowerCase(), catPill);
  const statCells = await page.locator("[data-testid='storefront-stats'] .vs-stat").count();
  check("A5: statbar = listings/rating/reviews", statCells === 3, `cells: ${statCells}`);

  // ---- B: preview banner v2 ----
  await page.goto(`${BASE}/vendor/preview`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("[data-testid='preview-banner']", { timeout: 30000 });
  const bannerText = (await page.locator("[data-testid='preview-banner']").textContent()) ?? "";
  check("B1: banner says 'Viewing as shopper'", bannerText.includes("Viewing as shopper"), bannerText.slice(0, 60));
  check("B2: banner has NO eyeball glyph", !bannerText.includes("👁"), bannerText.slice(0, 40));
  const exit = await page.locator("[data-testid='preview-exit']").count();
  const editS = await page.locator("[data-testid='preview-edit-storefront']").count();
  const editL = await page.locator("[data-testid='preview-edit-listings']").count();
  check("B3: exit + both edit links present", exit === 1 && editS === 1 && editL === 1, `${exit}/${editS}/${editL}`);

  // ---- C: analytics insights + health ----
  await page.goto(`${BASE}/vendor/analytics`, { waitUntil: "domcontentloaded", timeout: 60000 });
  // cold-compiled route: the weekly fetch lands post-hydration — wait for the
  // real content (health table always renders when data + listings exist),
  // not a fixed timeout.
  await page
    .waitForSelector("[data-testid='analytics-listing-health'], [data-testid='analytics-stats']", { timeout: 45000 })
    .catch(() => {});
  await page
    .waitForSelector("[data-testid='analytics-insights'], [data-testid='analytics-listing-health']", { timeout: 20000 })
    .catch(() => {});
  await page.waitForTimeout(1500);
  const insights = await page.locator("[data-testid='analytics-insights']").count();
  const insText = insights ? ((await page.locator("[data-testid='analytics-insights']").textContent()) ?? "") : "";
  check("C1: insights render", insights === 1, `section: ${insights}`);
  check("C2: dead-listing insight present", insText.includes("zero attention"), insText.slice(0, 120));
  const health = await page.locator("[data-testid='analytics-listing-health']").count();
  const healthText = health ? ((await page.locator("[data-testid='analytics-listing-health']").textContent()) ?? "") : "";
  check("C3: listing health table renders", health === 1, `section: ${health}`);
  check("C4: zero-view listing flagged Needs attention", healthText.includes("Needs attention"), healthText.slice(0, 100));
  // C5: the hot listing (6 views, 0 saves) ALSO correctly flags — 0% save rate
  // with real traffic is a conversion problem, exactly what needs-attention
  // exists for. Both probe listings should flag; the Healthy label renders
  // only when a listing has views AND a ≥5% save rate.
  const attentionCount = healthText.split("Needs attention").length - 1;
  check("C5: both weak listings flagged (0 views + 0% save-rate)", attentionCount === 2, `flags: ${attentionCount}`);

  await browser.close();
} catch (e) {
  results.push("FAIL fatal — " + String(e).slice(0, 300));
} finally {
  await sql`DELETE FROM page_events WHERE ref_id IN (${hotId}, ${vendorId})`;
  await sql`DELETE FROM listings WHERE vendor_id = ${vendorId}`;
  await sql`DELETE FROM sessions WHERE id = ${sessId}`;
  await sql`DELETE FROM vendors WHERE id = ${vendorId}`;
  await sql`DELETE FROM identities WHERE id = ${idId}`;
  console.log("cleaned");
}

console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL")).length;
console.log(fails === 0 ? "ALL PASS" : `${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
