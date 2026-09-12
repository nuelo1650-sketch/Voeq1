import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto("http://localhost:3031/explore?next=mb", { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="mb-card"]', { timeout: 30000 });
await page.waitForTimeout(3000);
console.log("PRICES:", await page.evaluate(`(() => {
  const cards = [...document.querySelectorAll('[data-testid="mb-card"]')];
  const withZero = cards.filter(c => /\\u20a60\\b/.test(c.textContent || ''));
  const sample = cards.slice(0, 6).map(c => (c.textContent || '').match(/\\u20a6[\\d,]+/)?.[0] ?? '?');
  return JSON.stringify({ n: cards.length, zeroCount: withZero.length, sample });
})()`));
// hunt the "N" circle: any element ~40px round dark green with text 'N'
console.log("N-CIRCLE:", await page.evaluate(`(() => {
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    const t = (el.textContent || '').trim();
    if (t === 'N' && el.children.length === 0) {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      out.push(el.tagName + '.' + String(el.className).slice(0,50) + ' pos=' + cs.position + ' bg=' + cs.backgroundColor + ' rect=' + Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' parentCls=' + String(el.parentElement?.className).slice(0,50));
    }
  }
  return JSON.stringify(out.slice(0, 5));
})()`));
await page.goto("http://localhost:3031/?next=mb", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(6000);
console.log("LANDING PRICES:", await page.evaluate(`(() => {
  const els = [...document.querySelectorAll('[data-testid="mb-card"], [data-testid="mb-polaroid"], [data-testid="mb-live-card"]')];
  const zero = els.filter(c => /\\u20a60\\b/.test(c.textContent || ''));
  return JSON.stringify({ n: els.length, zeroCount: zero.length, first: (els[0]?.textContent || '').match(/\\u20a6[\\d,]+/)?.[0] });
})()`));
await browser.close();
