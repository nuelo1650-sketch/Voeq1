/**
 * content-visibility sanity probe: at 390px, scroll through the landing page
 * and verify every section (a) exists and (b) has non-zero height + visible
 * content AFTER scrolling to it (content-visibility renders on approach).
 * Fails loudly if any section is empty/zero-height after its scrollIntoView.
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3031";
const SECTIONS = [
  ["hero", "section.hero"],
  ["trending-rail", ".trending-rail-section"],
  ["category-grid", ".category-grid-section"],
  ["how-it-works", ".how-it-works-section"],
  ["trust-pillars", ".trust-pillars-section"],
  ["for-vendors", ".for-vendors-section"],
  ["footer", ".landing-footer"],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });

let failures = 0;
for (const [name, sel] of SECTIONS) {
  const el = page.locator(sel).first();
  const count = await el.count();
  if (!count) { console.log(`FAIL ${name}: selector missing`); failures++; continue; }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300); // let content-visibility render on approach
  const box = await el.boundingBox();
  const text = (await el.textContent()) ?? "";
  const hasContent = text.trim().length > 20;
  const visible = box && box.height > 40 && box.width > 100;
  const ok = !!visible && hasContent;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: h=${Math.round(box?.height ?? 0)} text=${text.trim().length}ch`);
  if (!ok) failures++;
}

// Scrollbar-stability: page height shouldn't shift wildly after render
const h1 = await page.evaluate(() => document.body.scrollHeight);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(400);
const h2 = await page.evaluate(() => document.body.scrollHeight);
const shift = Math.abs(h2 - h1);
console.log(`${shift < 300 ? "PASS" : "FAIL"} height stability: ${h1} → ${h2} (shift ${shift}px)`);

await browser.close();
console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
