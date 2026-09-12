import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3031/listing/vis-ankara-cmpmtymm8pg", { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="listing-detail"]', { timeout: 30000 });
await page.waitForTimeout(3500);
// 1) who is the "N" circle?
console.log("N:", await page.evaluate(`(() => {
  for (const el of document.querySelectorAll('*')) {
    const own = [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
    if (own === 'N') { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      let path = '', n = el; while (n && n.tagName !== 'BODY') { path = (n.tagName + (n.id?'#'+n.id:'') + (n.className? '.'+String(n.className).split(' ')[0]:'')).slice(0,30) + ' > ' + path; n = n.parentElement; }
      return JSON.stringify({ rect: Math.round(r.x)+','+Math.round(r.y)+' '+Math.round(r.width)+'x'+Math.round(r.height), pos: cs.position, path });
    }
  } return 'none';
})()`));
// 2) does "More from this market/vendor" render?
console.log("rails:", await page.evaluate(`(() => {
  const hs = [...document.querySelectorAll('h2,h3')].map(h => (h.textContent||'').trim().slice(0,40));
  return JSON.stringify(hs);
})()`));
// 3) share button width (the stretched one)
console.log("share:", await page.evaluate(`(() => {
  const btns = [...document.querySelectorAll('[data-testid="listing-detail"] a,[data-testid="listing-detail"] button')].filter(b => /share/i.test(b.textContent||''));
  return JSON.stringify(btns.map(b => { const r = b.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height) + ' flex=' + getComputedStyle(b.parentElement).display; }));
})()`));
await browser.close();
