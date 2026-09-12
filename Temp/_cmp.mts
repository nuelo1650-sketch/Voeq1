/** side-by-side capture: mock vs build, same scroll targets, both widths */
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import fs from "node:fs";

const browser = await chromium.launch();
for (const [w, h] of [[1280, 900], [390, 844]] as const) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });

  // --- MOCK ---
  await page.goto("file:///C:/Users/Legacy/Documents/voeq/money-bag/mocks/explore-v1.html");
  await page.waitForTimeout(1500);
  // scroll so 'Trending this week' header is near the top of the frame
  const mockY = await page.evaluate(`(() => {
    const h = [...document.querySelectorAll('h2')].find(x => x.textContent.includes('Trending'));
    return h ? h.getBoundingClientRect().top + scrollY - 20 : 0;
  })()`);
  await page.evaluate(`window.scrollTo(0, ${mockY})`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `Temp/cmp-mock-${w}.png` });

  // --- BUILD (needs seeded fixtures) ---
  const r = execSync("npx tsx Temp/_visshots-seedonly.mts", { encoding: "utf8" });
  const stamp = r.match(/stamp=(\S+)/)?.[1] ?? "";
  const url = process.env.LIVE_SHOTS === "1" ? "https://voeq.ng" : "http://localhost:3031";
  await page.goto(url + "/explore?next=mb", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="mb-card"]').length >= 8, { timeout: 60000 });
  await page.waitForTimeout(3500);
  const realY = await page.evaluate(`(() => {
    const h = [...document.querySelectorAll('h2')].find(x => x.textContent.includes('Trending'));
    return h ? h.getBoundingClientRect().top + scrollY - 20 : 0;
  })()`);
  await page.evaluate(`window.scrollTo(0, ${realY})`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `Temp/cmp-real-${w}.png` });
  await page.close();
  console.log(`done ${w} stamp=${stamp}`);
}
await browser.close();
