import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const t = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const u = t.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "").replace("/neondb?", "/neondb_test?");
const sql = neon(u);
const d1 = await sql`DELETE FROM listings WHERE id LIKE 'vis-%-mtyeam3u'`;
const d2 = await sql`DELETE FROM vendors WHERE id LIKE 'vis-%-mtyeam3u'`;
console.log("stale vis fixtures deleted:", d1.length + d2.length);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto("http://localhost:3031/?next=mb", { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="mb-card"]', { timeout: 40000 });
await page.waitForTimeout(3000);
console.log("N-HUNT:", await page.evaluate(`(() => {
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (own === 'N' || own === 'M') {
      const r = el.getBoundingClientRect();
      if (r.width > 8 && r.width < 80 && r.height > 8) {
        const cs = getComputedStyle(el);
        out.push(el.tagName + ' "' + own + '" ' + Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' br=' + cs.borderRadius + ' pos=' + cs.position + ' parent=' + String(el.parentElement?.className || el.parentElement?.tagName).slice(0, 50));
      }
    }
  }
  return JSON.stringify(out.slice(0, 8), null, 1);
})()`));
await browser.close();
