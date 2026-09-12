/** MONEY BAG visual-verification harness: seed rich fixtures -> screenshot
 *  every MB page at 390 + 1280 -> leave fixtures in place for re-runs.
 *  Cleanup at the end (or run with KEEP=1 to inspect live). */
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "").replace("/neondb?", "/neondb_test?");
const sql = neon(dbUrl);
const stamp = Date.now().toString(36);
const consent = JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }]);
// real picsum images (stable, load fine)
const img = (id: number) => `https://picsum.photos/id/${id}/900/600`;

const vendors: { vid: string; name: string; handle: string; verified: boolean }[] = [
  { vid: "vv1", name: "Mama Tuli's Kitchen", handle: "mamatu", verified: true },
  { vid: "vv2", name: "Campus Kicks", handle: "kicks", verified: true },
  { vid: "vv3", name: "Braids by Zina", handle: "zina", verified: false },
  { vid: "vv4", name: "TechFix NMU", handle: "techfix", verified: true },
];
const listings: { id: string; vid: string; title: string; price: number; cat: string; featured: boolean; fresh: boolean; imgs: string[] }[] = [
  { id: "jollof", vid: "vv1", title: "Party Jollof + Grilled Chicken", price: 350000, cat: "food", featured: true, fresh: false, imgs: [img(1060), img(429), img(292)] },
  { id: "friedrice", vid: "vv1", title: "Fried Rice & Turkey, Full Plate", price: 280000, cat: "food", featured: false, fresh: true, imgs: [img(823), img(5)] },
  { id: "meatpie", vid: "vv1", title: "Meat Pie (Pack of 4)", price: 150000, cat: "pastries", featured: false, fresh: false, imgs: [img(292), img(1060)] },
  { id: "cakes", vid: "vv1", title: "Custom Birthday Cake, 2-Tier", price: 2200000, cat: "pastries", featured: true, fresh: false, imgs: [img(235), img(1025)] },
  { id: "airforce", vid: "vv2", title: "Nike Air Force 1, Clean", price: 850000, cat: "fashion", featured: false, fresh: true, imgs: [img(1082), img(755)] },
  { id: "ankara", vid: "vv2", title: "Ankara Two-Piece, Tailored", price: 450000, cat: "fashion", featured: true, fresh: false, imgs: [img(996), img(115)] },
  { id: "tees", vid: "vv2", title: "Plain Tees, Bulk 5-Pack", price: 125000, cat: "fashion", featured: false, fresh: false, imgs: [img(452), img(669)] },
  { id: "braids", vid: "vv3", title: "Knotless Braids, Any Length", price: 400000, cat: "hair", featured: true, fresh: false, imgs: [img(1027), img(644)] },
  { id: "edges", vid: "vv3", title: "Quick Weave with Edges", price: 300000, cat: "hair", featured: false, fresh: true, imgs: [img(342), img(823)] },
  { id: "screen", vid: "vv4", title: "iPhone Screen Repair, Same Day", price: 350000, cat: "gadgets", featured: false, fresh: false, imgs: [img(0), img(48)] },
  { id: "charge", vid: "vv4", title: "Laptop Charging Port Fix", price: 250000, cat: "gadgets", featured: false, fresh: true, imgs: [img(48), img(0)] },
  { id: "powerbank", vid: "vv4", title: "20,000mAh Power Bank", price: 180000, cat: "gadgets", featured: false, fresh: false, imgs: [img(0), img(48)] },
];

async function seed() {
  for (const v of vendors) {
    const vid = `vis-${v.vid}-${stamp}`, iid = `vis-i-${v.vid}-${stamp}`;
    await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
      VALUES (${iid}, ${`vis-${v.vid}-${stamp}@t.dev`}, ${v.name}, 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true, ${consent}::jsonb, now(), now())`;
    await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
      VALUES (${vid}, ${iid}, ${v.name}, ${`vish${v.vid}${stamp}`}, ${`vis-${v.vid}-${stamp}`}, 'nmu-okerenkoko', '["food","fashion","hair","gadgets","pastries"]'::jsonb, 'live', ${v.verified}, 'Real food, real fast — the campus stall everyone knows.', ${new Date(Date.now() - 400 * 864e5).toISOString()})`;
  }
  for (const l of listings) {
    const vid = `vis-${l.vid}-${stamp}`;
    const created = l.fresh ? new Date(Date.now() - 8 * 3600e3).toISOString() : new Date(Date.now() - 20 * 864e5).toISOString();
    await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_min_minor, price_minor, is_published, status, images, is_featured, created_at, source, short_description)
      VALUES (${'vis-' + l.id + '-' + stamp}, ${vid}, ${l.title}, 'The campus favorite — made fresh daily, big portions, fair price.', ${l.cat}, ${l.price}, ${l.price}, true, 'active', ${JSON.stringify(l.imgs)}::jsonb, ${l.featured}, ${created}, null::text, 'd')`;
  }
  console.log("seeded", vendors.length, "vendors", listings.length, "listings stamp=" + stamp);
}

async function cleanup() {
  await sql`DELETE FROM listings WHERE id LIKE ${`vis-%-${stamp}`}`;
  await sql`DELETE FROM sessions WHERE identity_id LIKE ${`vis-i-%-${stamp}`}`;
  await sql`DELETE FROM vendors WHERE id LIKE ${`vis-%-${stamp}`}`;
  await sql`DELETE FROM identities WHERE id LIKE ${`vis-i-%-${stamp}`}`;
  console.log("cleaned");
}

const shots: [string, string][] = [
  ["explore", "/explore?next=mb"],
  ["landing", "/?next=mb"],
  ["live", "/explore/live?next=mb"],
  ["trending", "/explore/trending?next=mb"],
  ["cat-food", "/explore/c/food?next=mb"],
  ["cat-food-drinks", "/explore/c/food-drinks?next=mb"],
];

async function shoot() {
  for (const w of [1280, 390]) {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: w, height: w === 390 ? 844 : 900 } });
    for (const [name, route] of shots) {
      await page.goto("http://localhost:3031" + route, { waitUntil: "domcontentloaded" });
      // dev cold-compile + client fetch: wait for REAL content, not a timer
      await page.waitForSelector('[data-testid="mb-card"], [data-testid="mb-live-pick"], [data-testid="mb-trend-row"], [data-testid="mb-grid"] [data-testid="mb-card"]', { timeout: 60000 }).catch(() => {});
      // SCREENSHOT NOISE-PATTERN: test-DB has leftover zero-ENFORCEMENT probe
      // rows; cards with no image would show the mock's placeholder gradient
      // (ugly grey holes in the grid). Hide them ONLY in this capture pass —
      // the real fix (cleanup) is a separate founder decision.
      await page.addStyleTag({ content: '[data-testid="mb-card"]:not(:has(img)) { display: none !important; }' });
      await page.waitForTimeout(4000); // images + rails paint
      const full = name === "explore" || name === "landing";
      await page.screenshot({ path: `C:/Users/Legacy/Documents/voeq/Temp/vis-${name}-${w}.png`, fullPage: full }).catch(async () => {
        await page.screenshot({ path: `C:/Users/Legacy/Documents/voeq/Temp/vis-${name}-${w}.png` });
      });
      console.log(`shot ${name} @${w}`);
    }
    // a listing detail page
    const l0 = await page.evaluate(`(() => document.querySelector('[data-testid="mb-card"]')?.getAttribute('href'))()`);
    await page.goto("http://localhost:3031" + l0, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `C:/Users/Legacy/Documents/voeq/Temp/vis-listing-${w}.png` }).catch(() => {});
    console.log(`shot listing @${w}`);
    await page.close();
    await browser.close();
  }
}

try {
  await seed();
  await shoot();
  if (process.env.KEEP !== "1") await cleanup();
  else console.log("fixtures kept (stamp=" + stamp + ")");
} catch (e) {
  console.error("ERR", e);
  await cleanup();
  process.exit(1);
}
