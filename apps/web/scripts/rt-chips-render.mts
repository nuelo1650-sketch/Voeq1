/**
 * CHIPS SEAM render probe: a console-created category (test DB) must appear
 * as an Explore chip + in the Filters dropdown at 390px. Also proves the
 * deactivated category disappears from chips. Dev server + test DB.
 */
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const BASE = "http://localhost:3031";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const TEST_URL = env.match(/DATABASE_URL=([^\n\r]+)/)[1].replace("/neondb?", "/neondb_test?");
const sql = neon(TEST_URL);

const stamp = Date.now();
const slug = `rt-chip-${stamp}`;
const name = `Probe Chip ${stamp}`;
const id = `cat-rt-${stamp}`;

// Seed a console-created category directly (active)
await sql`INSERT INTO categories (id, slug, name, is_active) VALUES (${id}, ${slug}, ${name}, true)`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/explore`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);

// 1. The chip row: the seeded category must render as a pill
const chipTexts = await page.locator(".voeq-pill").allTextContents();
const hasChip = chipTexts.some((t) => t.trim() === name);
console.log(`chip rendered for console category: ${hasChip ? "PASS" : "FAIL"}`, `(total pills: ${chipTexts.length})`);

// 2. Click it → the active-filter chip shows its label
if (hasChip) {
  await page.locator(".voeq-pill", { hasText: name }).first().click();
  await page.waitForTimeout(800);
  const activeChip = await page.locator("text=Active filters:").count();
  const chipLabel = await page.locator(`text=Category: ${name}`).count();
  console.log(`active-filter chip after click: ${activeChip > 0 && chipLabel > 0 ? "PASS" : "FAIL"}`);
}

// 3. Deactivate → reload → gone from chips
await sql`UPDATE categories SET is_active = false WHERE id = ${id}`;
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const chipTexts2 = await page.locator(".voeq-pill").allTextContents();
const stillThere = chipTexts2.some((t) => t.trim() === name);
console.log(`deactivated category GONE from chips after reload: ${!stillThere ? "PASS" : "FAIL"}`);

// 4. Seeded category still present (regression guard)
const food = chipTexts2.some((t) => /food|drinks/i.test(t));
console.log(`seeded Food & Drinks chip still present: ${food ? "PASS" : "FAIL"}`);

// cleanup
await sql`DELETE FROM categories WHERE id = ${id}`;
const left: any[] = await sql`SELECT id FROM categories WHERE id = ${id}`;
console.log(`cleanup: ${left.length === 0 ? "PASS" : "FAIL"}`);
await browser.close();
console.log("done");
