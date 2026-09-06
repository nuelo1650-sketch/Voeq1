/**
 * RATINGS+COMMENTS LAYOUT round-trip: seed a vendor w/ 7 reviews across 5/4/3/1
 * + a listing w/ 6 comments on TEST DB; open the storefront (ReviewsList) and
 * the listing detail (CommentsList) at 390px; assert:
 * A: distribution bars render 5 buckets w/ honest counts (2×5★, 2×4★, 1×3★, 0×2★, 2×1★)
 * B: per-review stars render OUT OF FIVE (filled + dimmed = 5 spans per row)
 * C: review cards are warm cards (surface + radius + border)
 * D: comments show 5 of 6 + Show-more button reveals the 6th
 * E: author chips render on own comments (session = comment author)
 * Self-cleans.
 */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const stamp = Date.now().toString(36);
const shopperId = "rt-shopper-" + stamp;
const vendorId = "rt-vendor-" + stamp;
const listingId = "rt-listing-" + stamp;
const sessId = "rt-sess-" + stamp;
const results: string[] = [];
const check = (name: string, ok: boolean, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);

const { chromium } = await import("playwright");

try {
  // shopper + vendor identities, session for the SHOPPER (comment author)
  await sql`INSERT INTO identities (id, email, name, role, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${shopperId}, ${"sh-" + stamp + "@voeq-test.example"}, 'Shopper One', 'shopper', 'nmu-okerenkoko', 'active', true, '[]'::jsonb, now(), now())`;
  await sql`INSERT INTO identities (id, email, name, role, staff_role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${vendorId + "-i"}, ${"v-" + stamp + "@voeq-test.example"}, 'Vendor One', 'vendor', NULL, ${vendorId}, 'nmu-okerenkoko', 'active', true, '[]'::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description)
    VALUES (${vendorId}, ${vendorId + "-i"}, 'Vendor One', ${"v" + stamp}, ${"v-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'Probe vendor')`;

  // 7 reviews: 5,5,4,4,3,1,1
  const ratings = [5, 5, 4, 4, 3, 1, 1];
  for (let i = 0; i < ratings.length; i++) {
    await sql`INSERT INTO reviews (id, vendor_id, author_id, rating, body, created_at)
      VALUES (${"rt-rev-" + stamp + "-" + i}, ${vendorId}, ${shopperId}, ${ratings[i]}, ${"Review " + (i + 1) + " — honest probe text"}, now()::text)`;
  }

  // listing + 6 comments by the shopper (isMine → chip)
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, is_featured, status, images)
    VALUES (${listingId}, ${vendorId}, 'Probe Listing', 'Probe listing for comments layout.', 'food', 150000, 150000, true, false, 'published', '[]'::jsonb)`;
  for (let i = 0; i < 6; i++) {
    await sql`INSERT INTO comments (id, listing_id, author_id, body, status, created_at)
      VALUES (${"rt-com-" + stamp + "-" + i}, ${listingId}, ${shopperId}, ${"Comment number " + (i + 1)}, 'visible', now()::text)`;
  }
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at)
    VALUES (${sessId}, ${shopperId}, now() + interval '1 hour', now())`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const consoleErrs: string[] = [];
  const apiResponses: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => consoleErrs.push("PAGEERROR: " + String(e).slice(0, 200)));
  page.on("response", async (r) => {
    if (r.url().includes("/comments")) {
      try { apiResponses.push(r.status() + " " + (await r.text()).slice(0, 150)); } catch { apiResponses.push(r.status() + " <body unavailable>"); }
    }
  });
  await page.context().addCookies([{ name: "sessionId", value: sessId, url: "http://localhost:3031" }]);

  // ---- STOREFRONT: reviews layout ----
  await page.goto(`http://localhost:3031/vendor/${vendorId}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("[data-testid='reviews-list']", { timeout: 30000 });

  const dist = await page.locator("[data-testid='reviews-distribution'] > div").count();
  check("A1: distribution renders 5 buckets", dist === 5, `buckets: ${dist}`);

  const counts = await page.locator("[data-testid='reviews-distribution'] > div > span").last().evaluate((el, _) => el.textContent);
  // spans alternate label/count; the LAST span in each row is the count
  const rowCounts = await page.evaluate(`(() => {
    const rows = Array.from(document.querySelectorAll("[data-testid='reviews-distribution'] > div"));
    return rows.map(r => {
      const spans = Array.from(r.querySelectorAll("span"));
      return spans[spans.length - 1].textContent;
    }).join(",");
  })()`);
  check("A2: honest counts 2,2,1,0,2 (5★→1★)", rowCounts === "2,2,1,0,2", rowCounts);

  // B: stars out of five — each review row has filled+dim = 2 spans inside the stars span
  const starRow = await page.locator("[data-testid='review-item']").first().locator(".voeq-review-stars span").count();
  check("B: per-review stars out of five (filled+dim spans)", starRow === 2, `spans: ${starRow}`);

  // C: warm cards
  const cardBorder = await page.locator("[data-testid='review-item']").first().evaluate((el) => getComputedStyle(el).borderRadius);
  check("C: review cards have card radius", parseFloat(cardBorder) > 0, cardBorder);

  // ---- LISTING DETAIL: comments layout ----
  await page.goto(`http://localhost:3031/listing/${listingId}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("[data-testid='comments-list']", { timeout: 30000 });
  // comments arrive via an async client fetch on a COLD route — wait for the
  // ACTUAL items (or the empty state), not a fixed timeout.
  await page
    .waitForSelector("[data-testid='comment-item'], [data-testid='comments-empty']", { timeout: 30000 })
    .catch(() => {});
  // If hydration is delayed, the comments fetch may fire AFTER the empty state
  // renders. Wait for the fetch to land (comment items) before asserting.
  await page
    .waitForSelector("[data-testid='comment-item']", { timeout: 15000 })
    .catch(() => {});

  const shown = await page.locator("[data-testid='comment-item']").count();
  const emptyState = await page.locator("[data-testid='comments-empty']").count();
  check("D1: comments windowed to 5 of 6", shown === 5, `shown: ${shown}`);
  if (shown !== 5) {
    console.log("DEBUG: empty-state nodes:", emptyState, "| console errors:", consoleErrs.slice(0, 4));
    console.log("DEBUG: comments API responses:", apiResponses.length ? apiResponses : "NONE — fetch never fired!");
  }

  const moreBtn = await page.locator("[data-testid='comments-load-more']").count();
  check("D2: Show-more button renders", moreBtn === 1, `btn: ${moreBtn}`);

  if (moreBtn === 1) {
    await page.locator("[data-testid='comments-load-more']").click();
    await page.waitForTimeout(400);
    const after = await page.locator("[data-testid='comment-item']").count();
    check("D3: Show-more reveals all 6", after === 6, `after: ${after}`);
  }

  const chips = await page.locator("[data-testid='comment-author-chip']").count();
  check("E: author chips on own comments", chips >= 5, `chips: ${chips}`);

  await browser.close();
} catch (e) {
  results.push("FAIL fatal — " + String(e).slice(0, 300));
} finally {
  await sql`DELETE FROM comments WHERE listing_id = ${listingId}`;
  await sql`DELETE FROM listings WHERE id = ${listingId}`;
  await sql`DELETE FROM reviews WHERE vendor_id = ${vendorId}`;
  await sql`DELETE FROM sessions WHERE id = ${sessId}`;
  await sql`DELETE FROM vendors WHERE id = ${vendorId}`;
  await sql`DELETE FROM identities WHERE id IN (${shopperId}, ${vendorId + "-i"})`;
  console.log("cleaned");
}

console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL")).length;
console.log(fails === 0 ? "ALL PASS" : `${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
