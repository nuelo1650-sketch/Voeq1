import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const r = await b.newPage();
const j = await (await r.request.get("http://localhost:3031/api/explore")).json();
const lid = (j.data ?? [])[0]?.id;
await p.goto(`http://localhost:3031/listing/${lid}`, { waitUntil: "domcontentloaded" });
await p.waitForSelector('[data-testid="listing-detail"]', { timeout: 60000 });
await p.waitForTimeout(3000);
await p.evaluate("window.scrollTo(0, document.body.scrollHeight)");
await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(`(() => {
  const bar = document.querySelector('[data-testid="listing-sticky-cta"]');
  const br = bar?.getBoundingClientRect();
  // find lowest content element
  let maxB = 0, sel = '';
  for (const el of document.querySelectorAll('p, input, textarea, button, [data-testid="comment-form"]')) {
    if (el.closest('[data-testid="listing-sticky-cta"]')) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom > maxB && r.bottom < 5000) { maxB = r.bottom; sel = el.tagName + '.' + String(el.className).slice(0,20); }
  }
  return { barTop: br ? Math.round(br.y) : null, lowestContent: Math.round(maxB), lowestSel: sel, clear: br ? maxB <= br.y : 'no bar' };
})()`)));
await b.close();
