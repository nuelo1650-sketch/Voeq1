import { chromium } from "playwright";
const browser = await chromium.launch();
for (const [w, h] of [[1280, 900], [390, 844]] as const) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  // listing detail: first seeded listing
  await page.goto("http://localhost:3031/explore?next=mb", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="mb-card"]').length >= 8, { timeout: 60000 });
  await page.waitForTimeout(2000);
  const href = await page.evaluate(`(() => document.querySelector('[data-testid="mb-card"]')?.getAttribute('href'))()`);
  await page.goto("http://localhost:3031" + href, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="listing-detail"]', { timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `Temp/ls-listing-${w}.png`, fullPage: true });
  // storefront: follow vendor link on the listing
  const vend = await page.evaluate(`(() => document.querySelector('[data-testid="listing-detail-storefront-cta"]')?.getAttribute('href'))()`);
  if (vend) {
    await page.goto("http://localhost:3031" + vend, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `Temp/ls-storefront-${w}.png`, fullPage: true });
  } else console.log(w, "no storefront CTA href");
  await page.close();
  console.log("done", w, href, vend);
}
await browser.close();
