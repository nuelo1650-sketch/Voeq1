import { chromium } from "playwright";
const browser = await chromium.launch();
const liveEval = `(async () => {
  const pick = document.querySelector('[data-testid="mb-live-card"]');
  const stage = document.querySelector('[data-testid="mb-live-stage"]');
  const rail = document.querySelector('[data-testid="mb-xrail"]');
  const g = (e) => e ? { w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) } : null;
  return { pick: g(pick), stage: g(stage), rail: g(rail),
    stageDisplay: stage ? getComputedStyle(stage).display : "?",
    railOverflow: rail ? getComputedStyle(rail).overflowX : "?",
    railChild: rail && rail.firstElementChild ? Math.round(rail.firstElementChild.getBoundingClientRect().width) : "?" };
})()`;
const trendEval = `(async () => {
  const t = document.querySelector('[data-testid="mb-tcard"]');
  const hero = document.querySelector('[data-testid="mb-trend-hero"]');
  const g = (e) => e ? { w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) } : null;
  return { tcard: g(t), hero: g(hero), tcardCols: t ? getComputedStyle(t).gridTemplateColumns : "?" };
})()`;
const landEval = `(async () => {
  const spot = document.querySelector('[data-testid="mb-spotlight"]');
  const door = document.querySelector('[data-testid="mb-explore-door"]');
  const g = (e) => e ? { w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) } : null;
  const grid = door ? door.querySelector('[style*="grid"]') : null;
  return { spot: g(spot), door: g(door), doorCols: grid ? getComputedStyle(grid).gridTemplateColumns : "?" };
})()`;
for (const w of [390, 1280]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto("https://voeq.ng/explore/live?next=mb", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  console.log(w + " LIVE " + JSON.stringify(await page.evaluate(liveEval)));
  await page.goto("https://voeq.ng/explore/trending?next=mb", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  console.log(w + " TREND " + JSON.stringify(await page.evaluate(trendEval)));
  await page.goto("https://voeq.ng/?next=mb", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  console.log(w + " LANDING " + JSON.stringify(await page.evaluate(landEval)));
  await page.close();
}
await browser.close();
