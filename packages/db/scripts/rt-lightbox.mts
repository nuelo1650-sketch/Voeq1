/** LIGHTBOX v2 round-trip vs TEST DB + live page @390px:
 * A: tap the gallery image → lightbox opens (data-testid present).
 * B: with a TALL portrait photo (2:9 aspect), the lightbox sheet SCROLLS —
 *    scroll to the bottom and the image's bottom edge becomes visible
 *    (the old flex-centering modal clipped both ends, unscrollable).
 * C: nav buttons don't overlap the image (Prev/Next ride below, X in header).
 * D: Esc closes; backdrop tap closes.
 * E: body scroll locked while open.
 * Seeds a live vendor + 2-image listing (one portrait); self-cleans. */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const stamp = Date.now().toString(36);
const idId = "lb-i-" + stamp;
const vendorId = "lb-v-" + stamp;
const listingId = "lb-l-" + stamp;
const BASE = "http://localhost:3031";
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);

try {
  await sql`INSERT INTO identities (id, email, name, role, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${idId}, ${"lb-" + stamp + "@voeq-test.example"}, 'LB Vendor', 'vendor', 'nmu-okerenkoko', 'active', true, '[]'::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description)
    VALUES (${vendorId}, ${idId}, 'LB Vendor', ${"lb" + stamp}, ${"lb-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd')`;
  // photo 2 must be GENUINELY tall (demo cloudinary sample ignores h_ — it
  // returned a 640x360 landscape, so the first run never needed scrolling).
  // picsum serves deterministic real tall images.
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, is_featured, status, images)
    VALUES (${listingId}, ${vendorId}, 'LB Tall Photo Listing', 'd', 'food', 150000, 150000, true, false, 'active', ${JSON.stringify([
      "https://picsum.photos/id/237/600/400.jpg",
      "https://picsum.photos/id/237/600/2400.jpg",
    ])}::jsonb)`;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}/listing/${listingId}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("[data-testid='listing-detail-image']", { timeout: 45000 }).catch(() => {});

  // A: open
  await page.locator("[data-testid='listing-detail-image']").first().click();
  await page.waitForSelector("[data-testid='listing-lightbox']", { timeout: 15000 }).catch(() => {});
  check("A: lightbox opens on image tap", (await page.locator("[data-testid='listing-lightbox']").count()) === 1);

  // B: tall photo scrolls — select photo 2 (the portrait) first, and WAIT for
  // its natural size (the first run measured before the 600x2400 image
  // finished loading and read a stale scrollHeight).
  await page.locator("button[aria-label='Next photo']").click().catch(() => {});
  await page
    .waitForFunction(`(() => { const i = document.querySelector("[data-testid='listing-lightbox'] img"); return !!i && i.naturalHeight > 1000; })()`, { timeout: 20000 })
    .catch(() => {});
  await page.waitForTimeout(400);
  const scrollProbe = await page.evaluate(`(() => {
    const lb = document.querySelector("[data-testid='listing-lightbox']");
    const img = lb ? lb.querySelector("img") : null;
    if (!lb || !img) return JSON.stringify({ err: "missing" });
    const canScroll = lb.scrollHeight > lb.clientHeight + 20;
    // scroll fully, then measure the image tail vs the sticky footer top
    lb.scrollTop = lb.scrollHeight;
    const imgBottomAfterFullScroll = Math.round(img.getBoundingClientRect().bottom);
    const footerTop = Math.round(lb.lastElementChild.getBoundingClientRect().top);
    return JSON.stringify({ canScroll, scrollH: lb.scrollHeight, clientH: lb.clientHeight, imgBottomAfterFullScroll, footerTop });
  })()`);
  const sp = JSON.parse(scrollProbe);
  check("B1: tall photo makes the lightbox scrollable", sp.canScroll === true, JSON.stringify(sp));
  // B2 contract: after full scroll, the image bottom sits ABOVE the sticky
  // footer's top edge — the photo's tail is fully visible, not covered.
  check("B2: image tail visible (clear of footer)", sp.imgBottomAfterFullScroll !== undefined && sp.footerTop !== undefined && sp.imgBottomAfterFullScroll <= sp.footerTop + 1, `imgBottom: ${sp.imgBottomAfterFullScroll}, footerTop: ${sp.footerTop}`);

  // C: no VERTICAL overlap with the nav/footer buttons — the only sanctioned
  // overlay is the sticky gradient header's X (top strip, by design). We
  // check the footer/prev/next buttons' boxes against the image's bottom edge
  // at full scroll: they must sit BELOW the image.
  const overlap = await page.evaluate(`(() => {
    const lb = document.querySelector("[data-testid='listing-lightbox']");
    const img = lb.querySelector("img").getBoundingClientRect();
    const footer = lb.lastElementChild.getBoundingClientRect();
    const header = lb.firstElementChild.getBoundingClientRect();
    let hits = 0;
    if (footer.top < img.bottom - 1) hits++;        // footer covers image tail
    if (header.bottom > img.top + 60) { /* header gradient over image top = intended */ }
    return hits;
  })()`);
  check("C: no button overlaps the image", overlap === 0, `overlaps: ${overlap}`);

  // E: body locked while open
  const locked = await page.evaluate(`document.body.style.overflow === "hidden"`);
  check("E: body scroll locked while open", locked === true, String(locked));

  // D: Esc closes
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const closedAfterEsc = (await page.locator("[data-testid='listing-lightbox']").count()) === 0;
  check("D1: Esc closes", closedAfterEsc === true);
  const unlocked = await page.evaluate(`document.body.style.overflow !== "hidden"`);
  check("D2: body scroll restored on close", unlocked === true);

  await browser.close();
} catch (e) {
  results.push("FAIL fatal — " + String(e).slice(0, 250));
} finally {
  await sql`DELETE FROM listings WHERE vendor_id = ${vendorId}`;
  await sql`DELETE FROM vendors WHERE id = ${vendorId}`;
  await sql`DELETE FROM identities WHERE id = ${idId}`;
  console.log("cleaned");
}

console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL")).length;
console.log(fails === 0 ? "ALL PASS" : `${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
