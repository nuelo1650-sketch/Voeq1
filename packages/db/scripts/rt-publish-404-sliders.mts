/**
 * BUG A/B/C round-trip vs TEST DB + live dev:
 * A: publish a listing via the REAL create page → the success panel's
 *    View-listing href must be /listing/<REAL-ID> (not undefined) and the
 *    target must return 200.
 * B: as the seeded VENDOR identity, hit a 404 route → the back-link must
 *    point to /vendor/dashboard (not /home).
 * C: the saved page renders a multi-image saved listing as a swipe track.
 * Seeds throwaway vendor/identity/session + a 2-image listing; self-cleans.
 */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const stamp = Date.now().toString(36);
const idId = "rt-i-" + stamp;
const vendorId = "rt-v-" + stamp;
const sessId = "rt-s-" + stamp;
const results: string[] = [];
const check = (name: string, ok: boolean, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);

try {
  // vendor identity (live) + session
  await sql`INSERT INTO identities (id, email, name, role, staff_role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${idId}, ${"rt-" + stamp + "@voeq-test.example"}, 'Probe Vendor', 'vendor', NULL, ${vendorId}, 'nmu-okerenkoko', 'active', true, '[]'::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description)
    VALUES (${vendorId}, ${idId}, 'Probe Vendor', ${"pv" + stamp}, ${"pv-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'probe')`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at)
    VALUES (${sessId}, ${idId}, now() + interval '2 hours', now())`;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.context().addCookies([{ name: "sessionId", value: sessId, url: "http://localhost:3031" }]);

  // ---- A: real publish flow ----
  await page.goto("http://localhost:3031/vendor/listings/create", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("form input", { timeout: 30000 }).catch(() => {});
  // DEV HYDRATION: waits for real hydration — the fill targets are React-
  // controlled inputs; filling before hydration means values are discarded.
  await page.waitForFunction(`(() => !!document.querySelector("form input") && document.querySelectorAll("form input").length >= 3)()`, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.locator("form input[placeholder='What are you offering?']").fill("RT Slider Listing");
  await page.locator("form textarea").last().fill("Probe listing with two photos to verify the swipe track surfaces.");
  await page.locator("form input[placeholder='1000']").fill("2500");
  const sel = page.locator("form select").first();
  await sel.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  const optVal = await sel.locator("option").nth(1).getAttribute("value");
  await sel.selectOption(optVal!);
  await page.locator("button[type='submit']").click();
  // submit may race hydration on a cold route — wait for POST effects: either
  // the success panel or a submit error appears
  await page.waitForSelector("[data-testid='listing-published-success'], [role='alert']", { timeout: 30000 }).catch(() => {});
  const href = await page.locator("[data-testid='published-view-listing']").getAttribute("href").catch(() => null);
  check("A1: View-listing href is a real id (not undefined)", !!href && !href.includes("undefined"), `href: ${href}`);

  if (href && !href.includes("undefined")) {
    const resp = await page.goto(`http://localhost:3031${href}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    check("A2: published listing detail returns 200", resp?.status() === 200, `status: ${resp?.status()}`);
    const listingId = href.split("/listing/")[1];

    // ---- C-part1: detail page shows BOTH photos in the track (seed a
    // 2-image listing directly — the photo-less publish above correctly
    // renders the monogram, not a track) ----
    const imgListingId = "rt-img-" + stamp;
    await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, is_featured, status, images)
      VALUES (${imgListingId}, ${vendorId}, 'RT Two Photo Listing', 'Probe listing with two photos.', 'food', 150000, 150000, true, false, 'published', ${JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg", "https://res.cloudinary.com/demo/image/upload/food.jpg"])}::jsonb)`;
    await page.goto(`http://localhost:3031/listing/${imgListingId}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("[data-testid='listing-detail-track']", { timeout: 30000 }).catch(() => {});
    const imgs = await page.locator("[data-testid='listing-detail-track'] img").count();
    check("C1: detail track shows both photos", imgs === 2, `imgs: ${imgs}`);

    // ---- B: 404 page routes VENDORS to the vendor dashboard ----
    const nf = await page.goto("http://localhost:3031/definitely-not-a-page-" + stamp, { waitUntil: "domcontentloaded", timeout: 60000 });
    check("B1: unknown route 404s", nf?.status() === 404, `status: ${nf?.status()}`);
    const backHref = await page.locator("[data-testid='not-found-back']").getAttribute("href").catch(() => null);
    check("B2: vendor 404 back-link → /vendor/dashboard", backHref === "/vendor/dashboard", `href: ${backHref}`);

    // ---- C-part2: saved page renders the multi-image listing as a swipe track
    await sql`INSERT INTO wishlist_items (id, shopper_id, listing_id, created_at)
      VALUES (${"rt-save-" + stamp}, ${idId}, ${imgListingId}, now()::text)`;
    const savedPage = await page.goto("http://localhost:3031/saved", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);
    const savedTrack = await page.locator("[data-testid='saved-card-track']").count();
    check("C2: saved page card uses swipe track", savedTrack >= 1, `tracks: ${savedTrack}, page: ${savedPage?.status()}`);

    // cleanup the saved row either way
    await sql`DELETE FROM wishlist_items WHERE listing_id = ${imgListingId}`;
    await sql`DELETE FROM listings WHERE id = ${imgListingId}`;
  }

  await browser.close();
} catch (e) {
  results.push("FAIL fatal — " + String(e).slice(0, 300));
} finally {
  await sql`DELETE FROM listings WHERE vendor_id = ${vendorId}`;
  await sql`DELETE FROM sessions WHERE id = ${sessId}`;
  await sql`DELETE FROM vendors WHERE id = ${vendorId}`;
  await sql`DELETE FROM identities WHERE id = ${idId}`;
  console.log("cleaned");
}

console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL")).length;
console.log(fails === 0 ? "ALL PASS" : `${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
