/** PLATFORM AUDIT (night shift, founder: "why does filter always reset when I
 *  leave the page" + "audit first, we have users"):
 *  F: Explore filter state survival — set category+price+sort, navigate to a
 *     listing, come BACK (browsers-back and in-app back), assert state.
 *  S: silent-bug sweep — console errors on every tab-switch surface. */
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

// seed a live vendor + listing so explore has content
const iid = "pf-i-" + stamp, vid = "pf-v-" + stamp;
let listingId: string | null = null;
try {
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"pf-" + stamp + "@t.dev"}, 'PF Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'PF Vendor', ${"pf" + stamp}, ${"pf-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  listingId = "pf-l-" + stamp;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, status, images)
    VALUES (${listingId}, ${vid}, 'PF probe listing', 'd', 'food', 30000, 30000, true, 'active', '[]'::jsonb)`;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // ---- F: filter state survival ----
  await page.goto(BASE + "/explore", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2500);
  // open filters (mobile sheet), set category + sort via testids
  const filterBtn = page.locator("[data-testid='explore-filters-toggle']").first();
  await filterBtn.click().catch(() => {});
  await page.waitForSelector("[data-testid='explore-filters-sheet'] [data-testid='filter-sort']", { timeout: 15000 }).catch(() => {});
  const sheetScope = "[data-testid='explore-filters-sheet']";
  await page.locator(`${sheetScope} [data-testid='filter-category']`).selectOption("food").catch(() => {});
  await page.waitForTimeout(400);
  await page.locator(`${sheetScope} [data-testid='filter-sort']`).selectOption("newest").catch(() => {});
  await page.waitForTimeout(600);
  // close the sheet so the grid + chips show
  await page.locator("[data-testid='explore-filters-close']").click().catch(() => {});
  await page.waitForTimeout(400);
  // capture applied state via the active-chip text (Filters shows chips)
  const chipBefore = await page.evaluate(`(() => document.body.innerText.includes("Food & Drinks"))()`);
  check("F1: filter applied (chip visible)", chipBefore);
  // navigate away to a listing (direct goto — card click needs hydration)
  await page.goto(`${BASE}/listing/${listingId}`, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const wentToListing = page.url().includes("/listing/");
  check("F2: navigated away to a detail page", wentToListing, page.url().slice(0, 60));
  // come back via browser back
  await page.goBack();
  await page.waitForTimeout(2500);
  const chipAfter = await page.evaluate(`(() => document.body.innerText.includes("Food & Drinks"))()`);
  const sortAfter = await page.evaluate(`(() => {
    const selects = [...document.querySelectorAll("select")];
    return selects.some((s) => s.value === "newest");
  })()`);
  check("F3: category filter SURVIVES back-navigation", chipAfter, `chip=${chipAfter}`);
  check("F4: sort SURVIVES back-navigation", sortAfter);
  // come back via fresh /explore entry (the founder's exact complaint)
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.goto(BASE + "/explore", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const chipAfterNav = await page.evaluate(`(() => document.body.innerText.includes("Food & Drinks"))()`);
  check("F5: category filter survives fresh /explore entry", chipAfterNav, `chip=${chipAfterNav}`);

  await browser.close();
} catch (e) {
  results.push("FAIL exception — " + String(e).slice(0, 300));
} finally {
  await Promise.all([
    sql`DELETE FROM listings WHERE id = ${listingId}`,
    sql`DELETE FROM vendors WHERE id = ${vid}`,
    sql`DELETE FROM identities WHERE id = ${iid}`,
  ]).catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL") && !r.includes("informational"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
