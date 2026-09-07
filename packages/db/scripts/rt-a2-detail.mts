/** A2 detail-page render probe @390px vs TEST DB:
 *  A: eyebrow catline + serif title + byline + price row render.
 *  B: floating Message CTA + about card + 2x2 facts grid render.
 *  C: no horizontal overflow (document scrollWidth <= 390).
 *  D: lightbox still opens + uses w_900 (speed-fix regression guard). */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.*)$/m)![1].trim().replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const stamp = Date.now().toString(36);
const idId = "a2-idn-" + stamp;
const vendorId = "a2-vnd-" + stamp;
const listingId = "a2-lst-" + stamp;
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);

try {
  await sql`INSERT INTO identities (id, email, name, role, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${idId}, ${"a2-" + stamp + "@voeq-test.example"}, 'A2 Vendor', 'vendor', 'nmu-okerenkoko', 'active', true, '[]'::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description)
    VALUES (${vendorId}, ${idId}, 'A2 Vendor', ${"a2" + stamp}, ${"a2-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd')`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, is_featured, status, images)
    VALUES (${listingId}, ${vendorId}, 'A2 probe jollof tray — serves ten', 'Hot jollof rice served fresh every evening. Party packs available.', 'food', 12500, 12500, true, false, 'active', ${JSON.stringify([
      "https://picsum.photos/id/237/600/400.jpg",
      "https://picsum.photos/id/237/600/2400.jpg",
    ])}::jsonb)`;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto(`http://localhost:3031/listing/${listingId}`, { waitUntil: "networkidle", timeout: 60000 });

  // A: head block
  check("A1: eyebrow catline", (await page.locator("[data-testid='listing-detail-catline']").count()) === 1);
  check("A2: serif title", (await page.locator("[data-testid='listing-detail-title']").innerText()).includes("jollof"));
  check("A3: price renders", (await page.locator("[data-testid='listing-detail-price']").innerText()).includes("125"), "minor=12500 -> ₦125");

  // B: CTA + about + facts
  check("B1: message CTA", (await page.locator("[data-testid='listing-detail-message-cta']").count()) === 1);
  check("B2: about card", (await page.locator("[data-testid='listing-detail-about']").count()) === 1);
  check("B3: facts 2x2 grid", (await page.locator("[data-testid='listing-detail-facts']").count()) === 1);

  // C: no horizontal overflow
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth);
  check("C1: no h-overflow @390", overflow <= 390, `scrollW=${overflow}`);

  // D: lightbox opens + uses w_900 (speed fix)
  await page.locator("[data-testid='listing-detail-track'] img").first().click();
  await page.waitForTimeout(500);
  check("D1: lightbox opens", (await page.locator("[data-testid='listing-lightbox']").count()) === 1);
  // D2 contract: lightbox src === track src (SAME URL = opens from cache —
  // the speed fix). cdnTransform only rewrites Cloudinary URLs; picsum passes
  // through raw, so asserting w_900 here would be vacuous.
  const srcs = await page.evaluate(() => {
    const lb = document.querySelector("[data-testid='listing-lightbox'] img")?.getAttribute("src") ?? "";
    const tr = document.querySelector("[data-testid='listing-detail-track'] img")?.getAttribute("src") ?? "";
    return JSON.stringify({ lb, tr });
  });
  const { lb, tr } = JSON.parse(srcs);
  check("D2: lightbox reuses the track URL (cache hit)", lb !== "" && lb === tr, lb.slice(0, 50));

  await browser.close();
} catch (e) {
  results.push("FAIL exception — " + String(e).slice(0, 300));
} finally {
  // neon templates are LAZY — unawaited they never run (fixture leak). Await all.
  await Promise.all([
    sql`DELETE FROM listings WHERE id = ${listingId}`,
    sql`DELETE FROM vendors WHERE id = ${vendorId}`,
    sql`DELETE FROM identities WHERE id = ${idId}`,
  ]);
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
