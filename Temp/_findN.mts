/** 1) what renders the floating "N" avatar (headless — so it's OUR DOM, not an
 *  extension)?  2) how much probe garbage is sitting in the test DB? */
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "").replace("/neondb?", "/neondb_test?");
const sql = neon(dbUrl);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3031/explore?next=mb", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
console.log("FIXED ELEMENTS:", await page.evaluate(`(() => {
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed') {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.bottom > window.innerHeight - 200 && r.left < 200)
        out.push(el.tagName + '.' + String(el.className).slice(0,40) + ' txt=' + (el.textContent||'').trim().slice(0,20) + ' z=' + cs.zIndex + ' rect=' + Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
  }
  return JSON.stringify(out);
})()`));
await page.close();
await browser.close();

const junk = await sql`SELECT id, title, images FROM listings WHERE is_published AND (images IS NULL OR images = '[]'::jsonb OR images::text LIKE '%null%' OR title ILIKE 'rt probe%' OR title ILIKE 'MBx %' OR title ILIKE 'MB %' OR title ILIKE 'RBG %' OR title ILIKE 'FX1 %' OR title ILIKE 'LX %' OR title ILIKE 'LXC %' OR title ILIKE 'LXD %' OR title ILIKE 'MBG %' OR title ILIKE 'A2 %')`;
console.log("JUNK LISTINGS:", junk.length);
for (const j of junk.slice(0, 20)) console.log(" -", j.id.slice(0, 18), "|", (j.title ?? "").slice(0, 30), "|", JSON.stringify(j.images).slice(0, 40));
