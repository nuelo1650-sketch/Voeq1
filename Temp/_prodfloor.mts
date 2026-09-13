import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("https://voeq.ng/explore?next=mb", { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.querySelectorAll('[data-testid="mb-card"]').length > 0, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(2500);
console.log("H2s:", await page.evaluate(`(() => [...document.querySelectorAll('h2')].map(h => h.textContent?.trim().split('\\n')[0].slice(0,28)).join(' | '))()`));
console.log("Budget:", await page.evaluate(`(() => !!document.querySelector('[data-testid="mb-budget"]'))()`));
console.log("Under5k:", await page.evaluate(`(() => !!document.querySelector('[data-testid="mb-under5k"]'))()`));
// storefront statbar on a live prod vendor
await page.goto("https://voeq.ng/api/explore?sections=1", { waitUntil: "domcontentloaded" }).catch(() => {});
await browser.close();
