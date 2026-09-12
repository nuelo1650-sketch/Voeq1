import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3031/?next=mb", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
await page.waitForTimeout(1500);
await page.screenshot({ path: "C:/Users/Legacy/Documents/voeq/Temp/vis-footer-scroll.png" });
// also geometry: footer rect vs page
console.log(await page.evaluate(`(() => {
  const f = document.querySelector('footer');
  const r = f.getBoundingClientRect();
  const kids = [...f.querySelectorAll('a')].slice(0,5).map(a => { const k = a.getBoundingClientRect(); return a.textContent.trim().slice(0,14) + ' y=' + Math.round(k.y) + ' vis=' + (k.width>0&&k.height>0); });
  return JSON.stringify({ pageH: document.body.scrollHeight, footTop: Math.round(r.top), footH: Math.round(r.height), scrollY: Math.round(scrollY), kids });
})()`));
await browser.close();
