import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const prodUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "");
const sql = neon(prodUrl);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });

// 1) explore renders real cards
await p.goto("https://voeq.ng/explore", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(6000);
console.log("EXPLORE cards:", await p.evaluate(`(() => {
  const els = [...document.querySelectorAll('[data-testid="listing-card"]')];
  const imgs = els.map(e => e.querySelector('img')).filter(i => i && i.complete && i.naturalWidth > 0).length;
  return JSON.stringify({ n: els.length, imagesLoaded: imgs, first: (els[0]?.textContent||'').trim().slice(0, 40) });
})()`));

// 2) a real listing page: image + price + message CTA
await p.goto("https://voeq.ng/listing/f1b60e9e-0ec-placeholder", { waitUntil: "domcontentloaded" }).catch(() => {});
const lid = await p.evaluate(`(() => document.querySelector('[data-testid="listing-card"]')?.getAttribute('href'))()`).catch(() => null);
await p.goto("https://voeq.ng" + (lid || "/"), { waitUntil: "domcontentloaded" }).catch(() => {});
await p.waitForTimeout(5000);
console.log("LISTING:", await p.evaluate(`(() => {
  const img = document.querySelector('[data-testid="listing-detail-image"], .explore-page img');
  return JSON.stringify({ url: location.pathname, img: !!img && img.naturalWidth > 0, price: (document.body.textContent||'').match(/\\u20a6 ?[\\d.,]+/)?.[0] || 'none', msg: !!document.querySelector('[data-testid="listing-detail-message"]') || /message/i.test(document.body.textContent||'') });
})()`));

// 3) storefront statbar
const vid = (await sql`SELECT vendor_id FROM listings WHERE id='f1b60e9e-0e47-4c9d-8b09-000000000000'`.catch(() => []))?.[0]?.vendor_id;
await p.goto("https://voeq.ng/vendor/" + encodeURIComponent((await sql`SELECT vendor_id FROM listings WHERE is_published LIMIT 1`.then(r => r[0].vendor_id)) as string), { waitUntil: "domcontentloaded" });
await p.waitForTimeout(5000);
console.log("STOREFRONT:", await p.evaluate(`(() => {
  const st = document.querySelector('[data-testid="storefront-stats"]');
  return JSON.stringify({ statbar: st ? st.textContent.replace(/\\s+/g,' ').trim().slice(0,70) : 'none', cards: document.querySelectorAll('[data-testid="listing-card"]').length });
})()`));
await b.close();

// 4) cron landed? inventory counts?
const snaps = await sql`SELECT COUNT(*)::int AS n FROM vendor_score_snapshot`;
console.log("score snapshots (cron ran?):", snaps[0].n);
const c = await sql`SELECT
  (SELECT COUNT(*)::int FROM listings WHERE is_published AND status='active') AS pub_listings,
  (SELECT COUNT(*)::int FROM vendors WHERE status='live') AS live_vendors`;
console.log("INVENTORY:", JSON.stringify(c[0]));
