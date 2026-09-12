/** MB GEOMETRY AUDIT: measures actual built pages at 390 + 1280.
 *  Read-only — no fixtures, no writes. Usage: npx tsx scripts/_mb-geo-audit.mts */
import { chromium } from "playwright";

const BASE = process.env.MB_BASE ?? "https://voeq.ng";
const routes = [
  ["/explore?next=mb", "explore"],
  ["/?next=mb", "landing"],
  ["/explore/live?next=mb", "live"],
  ["/explore/trending?next=mb", "trending"],
];

const browser = await chromium.launch();
for (const w of [390, 1280]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  for (const [route, name] of routes) {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(3000);
    const geo = await page.evaluate(() => {
      const out: any = {};
      // grids: find containers with MbCard children
      const cards = [...document.querySelectorAll('[data-testid="mb-card"]')];
      out.cardCount = cards.length;
      if (cards.length) {
        const r = cards[0].getBoundingClientRect();
        out.cardW = Math.round(r.width);
        out.cardH = Math.round(r.height);
        // columns: distinct x positions of cards in first two rows
        const xs = [...new Set(cards.slice(0, 8).map((c) => Math.round(c.getBoundingClientRect().x)))];
        out.cols = xs.length;
        // image aspect inside card
        const img = cards[0].querySelector("img");
        const ir = img?.getBoundingClientRect();
        if (ir && ir.height) out.imgAspect = +(ir.width / ir.height).toFixed(2);
      }
      // rails
      for (const t of ["mb-trending", "mb-under5k", "mb-fresh", "mb-live-shelf"]) {
        const el = document.querySelector(`[data-testid="${t}"]`);
        if (!el) continue;
        const inner = el.querySelector("[style*='grid'], [style*='flex']") as HTMLElement | null;
        const c = el.querySelector('[data-testid="mb-card"], [data-testid*="rail-card"]') as HTMLElement | null;
        out[t] = {
          display: inner ? getComputedStyle(inner).display : "?",
          cols: inner ? getComputedStyle(inner).gridTemplateColumns.split(" ").length : "?",
          childW: c ? Math.round(c.getBoundingClientRect().width) : "?",
          overflowX: inner ? getComputedStyle(inner).overflowX : "?",
        };
      }
      // landing-specific: spotlight + door + hero collage
      const pol = document.querySelector('[data-testid="mb-polaroid"], .mb-pol');
      out.polaroidW = pol ? Math.round((pol as HTMLElement).getBoundingClientRect().width) : null;
      const sec = [...document.querySelectorAll("h2")].map((h) => h.textContent?.trim().split("\n")[0].slice(0, 30)).filter(Boolean);
      out.sections = sec.slice(0, 10);
      return out;
    });
    console.log(`\n### ${w}px ${name} (${route})`);
    console.log(JSON.stringify(geo, null, 1));
  }
  await page.close();
}
await browser.close();
