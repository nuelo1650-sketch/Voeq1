/** GOODNIGHT PROD SWEEP — everything users should see, verified live */
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const prodUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "");
const sql = neon(prodUrl);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });

// 1) explore shows REAL listings (old visual, real data)
await p.goto("https://voeq.ng/explore", { waitUntil: "domcontentloaded" });
await p.waitForSelector('[data-testid="listing-card"], [data-testid="explore-grid"] a', { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(3000);
const cards = await p.evaluate(`(() => {
  const els = [...document.querySelectorAll('[data-testid="listing-card"]')];
  return { n: els.length, first: (els[0]?.textContent || '').trim().slice(0, 60) };
})()`);
console.log("EXPLORE:", JSON.stringify(cards));

// 2) listing detail: real price + image actually loads
const j = await (await p.request.get("https://voeq.ng/api/explore?sections=1")).json();
const real = (j.data ?? []).find((l: { images?: string[] }) => Array.isArray(l.images) && l.images.filter(Boolean).length > 0);
if (real) {
  await p.goto(`https://voeq.ng/listing/${real.id}`, { waitUntil: "domcontentloaded" });
  await p.waitForSelector('[data-testid="listing-detail"]', { timeout: 30000 });
  await p.waitForTimeout(2500);
  const l = await p.evaluate(`(() => {
    const img = document.querySelector('[data-testid="listing-detail-image"]') as HTMLImageElement | null;
    const price = (document.body.textContent || '').match(/\\u20a6\\s?[\\d.,]+/)?.[0] || '';
    const cta = !!document.querySelector('[data-testid="listing-detail-message"]');
    return { imgLoaded: !!img && img.complete && img.naturalWidth > 0, price, cta };
  })()`);
  console.log("LISTING:", JSON.stringify(l), real.title.slice(0, 30));
  const vend = await p.evaluate(`(() => document.querySelector('[data-testid="listing-detail-storefront-cta"]')?.getAttribute('href'))()`);
  if (vend) {
    await p.goto("https://voeq.ng" + vend, { waitUntil: "domcontentloaded" });
    await p.waitForSelector('[data-testid="storefront-stats"]', { timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(1500);
    console.log("STOREFRONT:", await p.evaluate(`(() => document.querySelector('[data-testid='storefront-stats']')?.textContent?.replace(/\\s+/g,' ').trim().slice(0,70))()`));
  }
}

// 3) landing renders (old design = the approved rollback target)
await p.goto("https://voeq.ng/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2000);
console.log("LANDING old-visual:", await p.evaluate(`(() => !document.querySelector('[data-testid="mb-landing"]'))()`));
await b.close();

// 4) nightly cron first run landed? (runs 21:00 UTC)
const snaps = await sql`SELECT COUNT(*)::int AS n FROM vendor_score_snapshot`;
const picks = await sql`SELECT COUNT(*)::int AS n FROM voeq_live_picks`;
console.log("DB:", JSON.stringify({ scoreSnapshots: snaps[0].n, livePicks: picks[0].n }));
// 5) public inventory
const counts = await sql`SELECT
  (SELECT COUNT(*) FROM listings WHERE is_published AND status='active') AS pub,
  (SELECT COUNT(*) FROM vendors WHERE status='live') AS livev,
  (SELECT COUNT(*) FROM vendors v WHERE v.status='live' AND EXISTS (SELECT 1 FROM listings l WHERE l.vendor_id=v.id AND l.is_published AND l.status='active')) AS livev_with_listings`;
console.log("INVENTORY:", JSON.stringify(counts[0]));
