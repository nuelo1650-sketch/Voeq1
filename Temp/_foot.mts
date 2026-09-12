import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3031/?next=mb", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
console.log(await page.evaluate(`(() => {
  const f = document.querySelector('footer, [class*="footer"], [class*="Footer"]');
  if (!f) return 'NO FOOTER ELEMENT';
  const r = f.getBoundingClientRect();
  return JSON.stringify({
    tag: f.tagName, cls: String(f.className).slice(0,60),
    h: Math.round(r.height), top: Math.round(r.top),
    links: f.querySelectorAll('a').length,
    text: (f.textContent || '').trim().slice(0, 140),
  });
})()`));
await browser.close();
