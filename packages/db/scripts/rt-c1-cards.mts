/** C1 VISUAL VERIFY: seed a verified vendor + review + 2-image listing on TEST
 * DB, screenshot Explore + a storefront at 390px, assert the C1 anatomy is
 * present (catline eyebrow, serif title, verified dot, footer price+stars),
 * and no button escapes its card. Self-cleans; screenshots saved. */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const stamp = Date.now().toString(36);
const idId = "c1-i-" + stamp;
const vendorId = "c1-v-" + stamp;
const listingId = "c1-l-" + stamp;
const shopperId = "c1-sh-" + stamp;
const BASE = "http://localhost:3031";
const SHOT_DIR = "C:/Users/Legacy/Documents/voeq/Temp/explore-card-variants";

await sql`INSERT INTO identities (id, email, name, role, campus, account_status, email_verified, consent, created_at, updated_at)
  VALUES (${idId}, ${"c1-" + stamp + "@voeq-test.example"}, 'Mama Tuli', 'vendor', 'nmu-okerenkoko', 'active', true, '[]'::jsonb, now(), now())`;
await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description)
  VALUES (${vendorId}, ${idId}, 'Mama Tuli', ${"c1" + stamp}, ${"c1-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'Hot jollof rice served fresh every evening. Party packs available.')`;
await sql`INSERT INTO identities (id, email, name, role, campus, account_status, email_verified, consent, created_at, updated_at)
  VALUES (${shopperId}, ${"c1s-" + stamp + "@voeq-test.example"}, 'Reviewer', 'shopper', 'nmu-okerenkoko', 'active', true, '[]'::jsonb, now(), now())`;
await sql`INSERT INTO reviews (id, vendor_id, author_id, rating, body, created_at)
  VALUES (${"c1-r-" + stamp}, ${vendorId}, ${shopperId}, 5, 'Best jollof on campus.', now()::text)`;
await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, is_featured, status, images)
  VALUES (${listingId}, ${vendorId}, 'Jollof rice party tray — serves 10', 'Large party tray.', 'food', 1250000, 1250000, true, true, 'active', ${JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg", "https://res.cloudinary.com/demo/image/upload/food.jpg"])}::jsonb)`;

const { chromium } = await import("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);

try {
  // Explore (publicOnly path needs a LIVE vendor — seeded live)
  await page.goto(`${BASE}/explore`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("[data-testid='listing-card']", { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const cards = await page.locator("[data-testid='listing-card']").count();
  check("explore: cards render", cards >= 1, `cards: ${cards}`);

  const card = page.locator("[data-testid='listing-card']").first();
  const anatomy = {
    catline: await page.locator("[data-testid='listing-catline']").first().textContent().catch(() => null),
    titleFF: await card.locator(".voeq-card-title").evaluate((el) => getComputedStyle(el).fontFamily).catch(() => null),
    priceFF: await card.locator(".voeq-card-price").evaluate((el) => getComputedStyle(el).fontFamily).catch(() => null),
    vbadge: await page.locator("[data-testid='listing-vbadge']").count(),
    featured: await page.locator("[data-testid='listing-featured']").count(),
    rating: await page.locator("[data-testid='listing-card-rating']").count(),
    dots: await card.locator(".voeq-card-dot").count(),
  };
  check("C1: category eyebrow renders", !!anatomy.catline, String(anatomy.catline));
  check("C1: serif display title", (anatomy.titleFF ?? "").includes("Fraunces") || (anatomy.titleFF ?? "").includes("serif"), String(anatomy.titleFF));
  check("C1: serif price", (anatomy.priceFF ?? "").includes("Fraunces") || (anatomy.priceFF ?? "").includes("serif"), String(anatomy.priceFF));
  check("C1: verified dot renders", anatomy.vbadge >= 1, `dots: ${anatomy.vbadge}`);
  check("C1: featured pill on image", anatomy.featured >= 1, `pills: ${anatomy.featured}`);
  check("C1: rating in footer", anatomy.rating >= 1, `rows: ${anatomy.rating}`);
  check("C1: swipe dots (2 photos)", anatomy.dots >= 2, `dots: ${anatomy.dots}`);
  await page.screenshot({ path: SHOT_DIR + "/explore-c1.png", fullPage: false });

  // Storefront
  await page.goto(`${BASE}/vendor/${vendorId}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("[data-testid='listing-card']", { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const sfVendorRows = await page.locator("[data-testid='storefront-page'] [data-testid='listing-vendor-name']").count();
  check("storefront: vendor row hidden on own grid", sfVendorRows === 0, `rows: ${sfVendorRows}`);
  const sfTitle = await page.locator("[data-testid='storefront-page'] .voeq-card-title").first().textContent().catch(() => null);
  check("storefront: C1 card renders", !!sfTitle, String(sfTitle));
  await page.screenshot({ path: SHOT_DIR + "/storefront-c1.png", fullPage: false });

  // Geometry: no button escapes its card on either surface
  for (const [name, path] of [["explore", "/explore"], ["storefront", `/vendor/${vendorId}`]] as const) {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1500);
    const esc = await page.evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('.voeq-card'));
      let escapes = 0;
      for (const c of cards) {
        const cr = c.getBoundingClientRect();
        for (const b of c.querySelectorAll('button')) {
          const br = b.getBoundingClientRect();
          if (br.width === 0) continue;
          if (br.right > cr.right + 1 || br.left < cr.left - 1) escapes++;
        }
      }
      return escapes;
    })()`);
    check(`${name}: no button escapes card`, esc === 0, `escapes: ${esc}`);
  }
} catch (e) {
  results.push("FAIL fatal — " + String(e).slice(0, 250));
} finally {
  await sql`DELETE FROM reviews WHERE vendor_id = ${vendorId}`;
  await sql`DELETE FROM listings WHERE vendor_id = ${vendorId}`;
  await sql`DELETE FROM vendors WHERE id = ${vendorId}`;
  await sql`DELETE FROM identities WHERE id IN (${idId}, ${shopperId})`;
  console.log("cleaned");
}

console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL")).length;
console.log(fails === 0 ? "ALL PASS" : `${fails} FAILURES`);
await browser.close();
process.exit(fails === 0 ? 0 : 1);
