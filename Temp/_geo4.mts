import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3031/explore?next=mb", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
console.log("RAIL:", await page.evaluate(`(() => {
  const rail = document.querySelector('[data-testid="mb-trending"] .mb-rail') || document.querySelector('[data-testid="mb-under5k"] .mb-rail');
  if (!rail) return 'no rail';
  return JSON.stringify({ sw: rail.scrollWidth, cw: rail.clientWidth, kids: rail.children.length, ox: getComputedStyle(rail).overflowX, disp: getComputedStyle(rail).display });
})()`));
await page.goto("http://localhost:3031/?next=mb", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
console.log("LANDING:", await page.evaluate(`(() => {
  const pol = document.querySelector('[data-testid="mb-polaroid"]');
  const grid = document.querySelector('[data-testid="mb-landing-grid"]');
  const spot = document.querySelector('[data-testid="mb-spotlight"]');
  return JSON.stringify({
    pol: !!pol, polW: pol ? Math.round(pol.getBoundingClientRect().width) : 0,
    grid: !!grid, gridCards: grid ? grid.querySelectorAll('[data-testid="mb-card"]').length : 0,
    spot: !!spot, spotStage: spot ? !!spot.querySelector('.mb-spot-stage') : false,
    heroText: (document.querySelector('[data-testid="mb-hero"]')?.textContent || '').slice(0, 80),
  });
})()`));
await browser.close();
