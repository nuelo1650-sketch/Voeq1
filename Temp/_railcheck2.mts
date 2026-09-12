import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const reqs: string[] = [];
page.on("request", (r) => { if (r.url().includes("/api/")) reqs.push(r.method() + " " + r.url().replace("http://localhost:3031", "").slice(0, 60)); });
await page.goto("http://localhost:3031/listing/vis-ankara-cmpmtymm8pg", { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="listing-detail"]', { timeout: 30000 });
await page.waitForTimeout(6000);
console.log("API requests fired:", JSON.stringify(reqs, null, 1));
console.log("in-page fetch works:", await page.evaluate(`(async () => {
  const r = await fetch('/api/explore'); const j = await r.json();
  return JSON.stringify({ n: (j.data ?? []).length });
})()`));
await browser.close();
