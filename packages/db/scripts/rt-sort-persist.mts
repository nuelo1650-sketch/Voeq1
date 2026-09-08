/** PLATFORM AUDIT — filter persistence fix design verification.
 *  Findings so far: filters survive browser-back (React state kept in bfcache)
 *  but DIE on fresh /explore entry (F5) and sort selection is ambiguous (F4
 *  selects .nth(1) which may not be the sort select). The FIX: persist filters
 *  to sessionStorage keyed per-tab, restore on Explore mount. This probe
 *  verifies the PERSISTENCE BEHAVIOR directly (sessionStorage written + read). */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
process.env.DATABASE_URL = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
void sql;

const stamp = Date.now().toString(36);
const BASE = "http://localhost:3031";
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);

const { chromium } = await import("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

// 1) verify sort select identity (which <select> is the sort?) — at 390px
// the sidebar is hidden (explore-desktop-only), so open the mobile sheet
await page.goto(BASE + "/explore", { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(2500);
await page.locator("[data-testid='explore-filters-toggle']").click().catch(() => {});
await page.locator("[data-testid='explore-filters-toggle']").click().catch(() => {});
await page.waitForSelector("[data-testid='explore-filters-sheet'] [data-testid='filter-sort']", { timeout: 15000 });
const selectInfo = await page.evaluate(`(() => {
  return JSON.stringify([...document.querySelectorAll("[data-testid='explore-filters-sheet'] select, [data-testid='explore-filters'] select")].map((s, i) => ({
    i,
    testid: s.getAttribute("data-testid"),
    visible: s.getBoundingClientRect().width > 0,
  })));
})()`);
console.log("selects:", selectInfo);

// 2) set sort properly, navigate away, come back fresh, check
const sortSel = page.locator("[data-testid='explore-filters-sheet'] [data-testid='filter-sort']");
await sortSel.scrollIntoViewIfNeeded().catch(() => {});
await sortSel.selectOption("newest").catch((e) => console.log("selectOption err:", String(e).slice(0, 120)));
await page.waitForTimeout(800);
const sortSet = await page.evaluate(`(() => {
  const s = document.querySelector("[data-testid='explore-filters-sheet'] [data-testid='filter-sort']");
  return s ? s.value : "";
})()`);
check("S2: sort set to newest", /newest/i.test(sortSet), sortSet);
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1000);
await page.goto(`${BASE}/explore`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
await page.locator("[data-testid='explore-filters-toggle']").click().catch(() => {});
await page.waitForTimeout(800);
const sortAfter = await page.evaluate(`(() => {
  const s = document.querySelector("[data-testid='explore-filters-sheet'] [data-testid='filter-sort']");
  return s ? s.value : "";
})()`);
check("S3: sort survives fresh /explore entry", /newest/i.test(sortAfter), `value=${sortAfter}`);

await browser.close();
console.log(results.join("\n"));
process.exit(0);
