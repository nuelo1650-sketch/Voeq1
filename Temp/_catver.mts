import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
for (const route of ["/explore/c/food?next=mb", "/explore/c/food-drinks?next=mb"]) {
  await page.goto("http://localhost:3031" + route, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  console.log(route, await page.evaluate(`(() => {
    const cards = document.querySelectorAll('[data-testid="mb-cat-grid"] [data-testid="mb-card"]');
    const empty = document.querySelector('[data-testid="mb-cat-empty"]') || [...document.querySelectorAll('*')].some(e => (e.textContent||'').trim() === 'Nothing here yet');
    const hero = (document.querySelector('[data-testid="mb-category-page"]')?.textContent.match(/\\d+ of \\d+ listings/) || ['?'])[0];
    const cols = cards[0] ? getComputedStyle(cards[0].parentElement).gridTemplateColumns.split(' ').length : 0;
    return JSON.stringify({ cards: cards.length, cols, empty: !!empty, hero });
  })()`));
}
await browser.close();
