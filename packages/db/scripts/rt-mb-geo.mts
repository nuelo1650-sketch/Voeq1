/** MONEY BAG GEOMETRY CONTRACT (founder audit 2026-09-11).
 *  The mock is the contract: card widths, column counts, image aspects and
 *  rail scrollability at 390 / 1280. Behavior probes passed while the page
 *  was structurally wrong — this gate makes that class of drift impossible.
 *  Seeds its own fixtures (6 real + 1 fresh + 1 featured) like rt-mb-floor.
 *  Usage: dev server on :3031 (test DB). npx tsx scripts/rt-mb-geo.mts */
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "").replace("/neondb?", "/neondb_test?");
const sql = neon(dbUrl);

const BASE = process.env.MB_BASE ?? "http://localhost:3031";
let failures = 0;
const check = (n: string, ok: boolean, d = "") => {
  console.log(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);
  if (!ok) failures++;
};

const stamp = Date.now().toString(36);
const iid = "mbg-i-" + stamp, vid = "mbg-v-" + stamp;
const consent = JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }]);
const IMG = "https://res.cloudinary.com/demo/image/upload/sample.jpg";

try {
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"mbg-" + stamp + "@t.dev"}, 'MBG Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true, ${consent}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'MBG Vendor', ${"mbgv" + stamp}, ${"mbg" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;

  const mk = async (n: string, featured = false, fresh = false) => {
    const created = fresh ? new Date().toISOString() : new Date(Date.now() - 10 * 864e5).toISOString();
    await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_min_minor, is_published, status, images, is_featured, created_at, source)
      VALUES (${`mbg-l-${n}-${stamp}`}, ${vid}, ${"MBG " + n}, 'd', 'food', 50000, true, 'active', ${JSON.stringify([IMG, IMG])}::jsonb, ${featured}, ${created}, null::text)`;
  };
  for (let i = 1; i <= 6; i++) await mk("item" + i, i === 1, i === 2);

  const browser = await chromium.launch();

  // ---------- explore floor geometry ----------
  for (const w of [390, 1280] as const) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto(`${BASE}/explore?next=mb`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="mb-grid"] [data-testid="mb-card"]').length >= 4, { timeout: 30000 });
    // rails render only when their section has items — wait for one to exist
    await page.waitForFunction(() => !!document.querySelector('.mb-rail [data-testid="mb-card"]'), { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const g = await page.evaluate(`(() => {
      const cards = [...document.querySelectorAll('[data-testid="mb-grid"] [data-testid="mb-card"]')];
      const c0 = cards[0];
      const xs = [...new Set(cards.slice(0, 8).map(c => Math.round(c.getBoundingClientRect().x)))];
      const gimg = c0?.querySelector('.mb-gimg')?.getBoundingClientRect();
      // measure the rail WITH THE MOST children — a 1-item rail cannot
      // overflow and would fail a scroll assertion vacuously.
      const rails = [...document.querySelectorAll('.mb-rail')].filter((r) => r.children.length > 0);
      rails.sort((a, b) => b.children.length - a.children.length);
      const rail = rails[0];
      const rc = rail?.querySelector('[data-testid="mb-card"]')?.getBoundingClientRect();
      return {
        n: cards.length,
        cardW: c0 ? Math.round(c0.getBoundingClientRect().width) : 0,
        cols: xs.length,
        imgAspect: gimg && gimg.height ? +(gimg.width / gimg.height).toFixed(2) : 0,
        railW: rc ? Math.round(rc.width) : 0,
        railKids: rail ? rail.children.length : 0,
        railScroll: rail ? rail.scrollWidth > rail.clientWidth + 20 : false,
      };
    })()`);
    // mock math: 390 → content 358, 2-col gap13 → 172; 1280 → content 1168, 4-col gap16 → 280
    const [lo, hi] = w === 390 ? [160, 185] : [265, 295];
    check(`grid card width @${w} in [${lo},${hi}]`, g.cardW >= lo && g.cardW <= hi, `got ${g.cardW} (n=${g.n})`);
    check(`grid columns @${w} = ${w === 390 ? 2 : 4}`, g.cols === (w === 390 ? 2 : 4), `got ${g.cols}`);
    check(`card image square @${w}`, Math.abs(g.imgAspect - 1) <= 0.06, `aspect ${g.imgAspect}`);
    const [rlo, rhi] = w === 390 ? [145, 175] : [255, 300];
    check(`rail card width @${w} in [${rlo},${rhi}]`, g.railW >= rlo && g.railW <= rhi, `got ${g.railW}`);
    check(`rail scrolls @${w}`, g.railScroll, `kids=${g.railKids} scrollable=${g.railScroll}`);
    await page.close();
  }

  // ---------- landing geometry (desktop) ----------
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${BASE}/?next=mb`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="mb-hero"]', { timeout: 30000 });
    // the collage/grid render only after /api/explore resolves — wait for data
    await page.waitForSelector('[data-testid="mb-polaroid"]', { timeout: 30000 });
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="mb-landing-grid"] [data-testid="mb-card"]').length >= 2, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const h = await page.evaluate(`(() => {
      const hero = document.querySelector('[data-testid="mb-hero"]');
      const cs = getComputedStyle(hero);
      const pol = document.querySelector('[data-testid="mb-polaroid"]');
      const grid = document.querySelector('[data-testid="mb-landing-grid"] [data-testid="mb-card"]');
      const spot = document.querySelector('[data-testid="mb-spotlight"]');
      const stage = spot?.querySelector('.mb-spot-stage');
      const sr = stage?.getBoundingClientRect();
      return {
        heroDisplay: cs.display,
        heroCols: cs.gridTemplateColumns.split(" ").length,
        polW: pol ? Math.round(pol.getBoundingClientRect().width) : 0,
        cardW: grid ? Math.round(grid.getBoundingClientRect().width) : 0,
        spotAspect: sr && sr.height ? +(sr.width / sr.height).toFixed(2) : 0,
      };
    })()`);
    check("hero splits 2-col @1280", h.heroDisplay === "grid" && h.heroCols === 2, JSON.stringify(h).slice(0, 80));
    check("polaroid ≤ 420 @1280", h.polW > 0 && h.polW <= 420, `got ${h.polW}`);
    check("landing grid card 4-up width @1280", h.cardW >= 265 && h.cardW <= 295, `got ${h.cardW}`);
    check("spotlight cinematic @1280", Math.abs(h.spotAspect - 16 / 7.4) < 0.6, `aspect ${h.spotAspect}`);
    await page.close();
  }

  // ---------- L2 pages (desktop) ----------
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${BASE}/explore/live?next=mb`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => !!document.querySelector('[data-testid="mb-live-pick"]'), { timeout: 30000 }).catch(() => {});
    // the default x-tab ranks by engagement (trending) — probe fixtures carry
    // none, so the rail correctly collapses there. Click Fresh: real data,
    // always non-empty when the pool has items. Same rail geometry either way.
    await page.click('[data-testid="mb-xtab-fresh"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const l = await page.evaluate(`(() => {
      const pick = document.querySelector('[data-testid="mb-live-pick"]');
      const rail = document.querySelector('.mb-rail [data-testid="mb-xcard"]')?.closest('.mb-rail');
      const cs = pick ? getComputedStyle(pick) : null;
      return {
        pickCols: cs ? cs.gridTemplateColumns.split(" ").length : 0,
        railScroll: rail ? rail.scrollWidth > rail.clientWidth + 20 : false,
      };
    })()`);
    check("live pick side-by-side @1280", l.pickCols === 2, `cols ${l.pickCols}`);
    check("live x-rail scrolls @1280", l.railScroll, String(l.railScroll));
    await page.close();
  }

  await browser.close();
} finally {
  await sql`DELETE FROM listings WHERE id LIKE ${`mbg-l-%-${stamp}`}`;
  await sql`DELETE FROM sessions WHERE identity_id = ${iid}`;
  await sql`DELETE FROM vendors WHERE id = ${vid}`;
  await sql`DELETE FROM identities WHERE id = ${iid}`;
}
console.log(failures === 0 ? "ALL PASS" : `FAILED: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
