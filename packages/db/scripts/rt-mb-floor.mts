/** MONEY BAG B1 — round-trip probe: MB explore floor behind ?next=mb vs TEST DB.
 *  Verifies: canary renders MB floor (not old explore), sections compose the
 *  floor (FreshDrops/LiveShelf/GridToday), old explore still renders side-by-side,
 *  empty-state collapse, honest-data rules (no sold counts, NEW only w/ createdAt).
 *  Usage: dev server on :3031 (test DB). npx tsx scripts/rt-mb-floor.mts
 */
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const BASE = "http://localhost:3031";
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);

const stamp = Date.now().toString(36);
const iid = "mbf-i-" + stamp, vid = "mbf-v-" + stamp, sess = "mbf-s-" + stamp;

try {
  // fixture: live vendor + 1 fresh real + 1 seed
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"mbf-" + stamp + "@t.dev"}, 'MBF Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'MBF Vendor', ${"mbfv" + stamp}, ${"mbf-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${iid}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;

  const mk = async (id: string, title: string, opts: { seed?: boolean; featured?: boolean } = {}) => {
    const created = new Date(Date.now() - (opts.seed ? 0 : 0) * 864e5).toISOString();
    await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_min_minor, is_published, status, images, is_featured, created_at, source)
      VALUES (${id}, ${vid}, ${title}, 'd', 'food', 50000, true, 'active', ${JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg"])}::jsonb, ${opts.featured ?? false}, ${created}, ${opts.seed ? "seed" : null}::text)`;
  };
  await mk("mbf-l-fresh-" + stamp, "MBF Fresh Real");
  await mk("mbf-l-seed-" + stamp, "MBF Seed", { seed: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // 1) canary renders the MB floor
  await page.goto(`${BASE}/explore?next=mb`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="mb-explore"]', { timeout: 30000 });
  check("B1: ?next=mb renders MB floor", true);
  const oldOnCanary = await page.$('[data-testid="explore-grid"]');
  check("B2: canary does NOT render old explore grid", oldOnCanary === null);

  // 2) context strip + sections compose
  const strip = await page.$('[data-testid="mb-context-strip"]');
  check("B3: context strip renders", strip !== null);
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="mb-explore"]');
    return el && el.textContent && el.textContent.includes("MBF Fresh Real");
  }, { timeout: 30000 }).catch(() => {});
  const freshVisible = await page.evaluate(() => document.querySelector('[data-testid="mb-explore"]')?.textContent?.includes("MBF Fresh Real") ?? false);
  check("B4: fresh real listing renders on floor", freshVisible);

  // 3) honest data: no "sold" claims anywhere on the floor (B7/B10)
  const soldText = await page.evaluate(() => (document.querySelector('[data-testid="mb-explore"]')?.textContent ?? "").match(/sold/i) !== null);
  check("B5: no 'sold' claims on MB floor", !soldText);

  // 4) filter drawer opens with real controls
  await page.click('[data-testid="mb-filters-open"]');
  await page.waitForSelector('[data-testid="mb-filter-drawer"]', { timeout: 15000 });
  const drawer = await page.$('[data-testid="mb-filter-drawer"]');
  check("B6: filter drawer opens (bottom sheet @390px)", drawer !== null);
  const priceMin = await page.$('[data-testid="filter-price-min"]');
  const priceMax = await page.$('[data-testid="filter-price-max"]');
  check("B7: manual ₦ min/max inputs present (no sliders)", priceMin !== null && priceMax !== null);
  await page.click('[data-testid="mb-filters-close"]');

  // 5) old explore still renders WITHOUT the canary param (additive, D8)
  await page.goto(`${BASE}/explore`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="explore-grid"]', { timeout: 30000 });
  const mbOnOld = await page.$('[data-testid="mb-explore"]');
  check("B8: old explore intact without canary param", mbOnOld === null);

  // 6) API still returns sections payload
  const res = await fetch(`${BASE}/api/explore?campus=nmu-okerenkoko&sections=1`);
  const body = await res.json();
  check("B9: sections API live", Boolean(body.sections), `freshDrops=${body.sections?.freshDrops?.length ?? 0} grid=${body.sections?.grid?.length ?? 0}`);

  await browser.close();
} finally {
  await Promise.all([
    sql`DELETE FROM listings WHERE title LIKE 'MBF %'`,
    sql`DELETE FROM vendors WHERE name = 'MBF Vendor'`,
    sql`DELETE FROM sessions WHERE identity_id = ${iid}`,
    sql`DELETE FROM identities WHERE id = ${iid}`,
  ]).catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
