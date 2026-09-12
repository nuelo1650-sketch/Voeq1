import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3031/explore?next=mb", { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="mb-card"]', { timeout: 30000 });
await page.waitForTimeout(2000);
console.log(await page.evaluate(`(() => {
  const cards = [...document.querySelectorAll('[data-testid="mb-grid"] [data-testid="mb-card"]')];
  const c0 = cards[0];
  const xs = [...new Set(cards.slice(0,8).map(c => Math.round(c.getBoundingClientRect().x)))];
  const gimg = c0?.querySelector('.mb-gimg');
  const rail = document.querySelector('[data-testid="mb-trending"] .mb-rail');
  return JSON.stringify({
    n: cards.length, xs,
    cardW: c0 ? Math.round(c0.getBoundingClientRect().width) : 0,
    gimg: gimg ? { w: Math.round(gimg.getBoundingClientRect().width), h: Math.round(gimg.getBoundingClientRect().height) } : null,
    rail: rail ? { sw: rail.scrollWidth, cw: rail.clientWidth, kids: rail.children.length } : null,
    gridCols: c0 ? getComputedStyle(c0.parentElement).gridTemplateColumns : "?",
  }, null, 1);
})()`));
await page.goto("http://localhost:3031/?next=mb", { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="mb-hero"]', { timeout: 30000 });
await page.waitForTimeout(2000);
console.log(await page.evaluate(`(() => {
  const pol = document.querySelector('[data-testid="mb-polaroid"]');
  const spot = document.querySelector('[data-testid="mb-spotlight"]');
  const stage = spot?.querySelector('.mb-spot-stage') ?? spot?.querySelector('[class*=spot]');
  const sr = stage?.getBoundingClientRect();
  return JSON.stringify({
    pol: pol ? Math.round(pol.getBoundingClientRect().width) : null,
    spotHTML: spot ? spot.innerHTML.slice(0, 200) : null,
    spotStage: sr ? { w: Math.round(sr.width), h: Math.round(sr.height) } : null,
  }, null, 1);
})()`));
await browser.close();
