import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto("http://localhost:3031/?next=mb", { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="mb-card"]', { timeout: 40000 });
await page.waitForTimeout(3000);
// the trust band: find the shield icon tile, then see WHAT element sits at its
// top-left corner (that's where the N circle clipped it in the crop)
console.log(await page.evaluate(`(() => {
  const band = document.querySelector('[data-testid="mb-trust-band"]');
  if (!band) return 'no band';
  const tiles = [...band.querySelectorAll('span[aria-hidden]')].filter(s => s.querySelector('svg'));
  const out = [];
  for (const tile of tiles) {
    const r = tile.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + 3, r.top + 3);
    if (hit && !tile.contains(hit) && hit !== tile) {
      out.push('OVERLAP at tile: ' + hit.tagName + '.' + String(hit.className).slice(0,60) + ' txt=' + (hit.textContent||'').slice(0,10) + ' pos=' + getComputedStyle(hit).position);
    }
  }
  // also: all round dark badges on page
  const rounds = [];
  for (const el of document.querySelectorAll('span,div,a,button')) {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (r.width >= 26 && r.width <= 60 && Math.abs(r.width - r.height) < 8 && parseFloat(cs.borderRadius) >= r.width/2 - 2 &&
        (cs.backgroundColor.match(/\\d+/g)||[0,0,0]).slice(0,3).every((v,i)=>v < 80) && (cs.backgroundColor.includes('rgb'))) {
      rounds.push(el.tagName + ' "' + (el.textContent||'').trim().slice(0,8) + '" ' + Math.round(r.x) + ',' + Math.round(r.y) + ' ' + cs.position);
    }
  }
  return JSON.stringify({ overlaps: out, rounds: rounds.slice(0, 10) }, null, 1);
})()`));
await browser.close();
