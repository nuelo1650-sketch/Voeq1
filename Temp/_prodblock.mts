/** what fixed/bottom elements cover the listing page at 390px ON PROD */
import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
// find a live listing
const r = await b.newPage();
const j = await (await r.request.get("https://voeq.ng/api/explore?sections=1")).json();
const lid = (j.data ?? [])[0]?.id;
await p.goto(`https://voeq.ng/listing/${lid}`, { waitUntil: "domcontentloaded" });
await p.waitForSelector('[data-testid="listing-detail"]', { timeout: 40000 });
await p.waitForTimeout(3500);
// scroll to bottom (comments area)
await p.evaluate("window.scrollTo(0, document.body.scrollHeight)");
await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(`(() => {
  const fixed = [];
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' || cs.position === 'sticky') {
      const r = el.getBoundingClientRect();
      if (r.width > 40 && r.height > 20 && cs.position === 'fixed') {
        fixed.push({ t: el.tagName, testid: el.getAttribute('data-testid') || '', cls: String(el.className).slice(0, 40), y: Math.round(r.y), h: Math.round(r.height), bottom: r.bottom > innerHeight - 5 });
      }
    }
  }
  const cm = document.querySelector('[data-testid="comment-form"], [data-testid="comment-body"]');
  const cmr = cm?.getBoundingClientRect();
  return { fixed, commentForm: cmr ? { y: Math.round(cmr.y), visible: cmr.y < innerHeight } : null, scrollY: Math.round(scrollY) };
})()`)));
await b.close();
