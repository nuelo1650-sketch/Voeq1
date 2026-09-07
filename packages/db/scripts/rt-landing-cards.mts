/** Landing card C1 + broken-image guard probe @390px vs TEST DB:
 *  A: landing trending-rail vendor cards render with compact icon buttons —
 *     heart + follow inside the photo, no collision with the status badge,
 *     nothing overflowing the card box.
 *  B: a listing with an EMPTY string in images[] renders NO src-less <img>
 *     on storefront grid + saved page (the matrix regression). */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const stamp = Date.now().toString(36);
const idId = "lc-i-" + stamp;
const vendorId = "lc-v-" + stamp;
const listingId = "lc-l-" + stamp;
const BASE = "http://localhost:3031";
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);

try {
  // live vendor + listing whose images[] has an EMPTY STRING first (the bug)
  await sql`INSERT INTO identities (id, email, name, role, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${idId}, ${"lc-" + stamp + "@voeq-test.example"}, 'LC Vendor', 'vendor', 'nmu-okerenkoko', 'active', true, '[]'::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description)
    VALUES (${vendorId}, ${idId}, 'LC Vendor', ${"lc" + stamp}, ${"lc-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd')`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, is_featured, status, images)
    VALUES (${listingId}, ${vendorId}, 'LC Empty Image Listing', 'd', 'food', 50000, 50000, true, false, 'active',
      ${JSON.stringify(["", "https://picsum.photos/id/237/600/400.jpg"])}::jsonb)`;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // ---- A: landing trending rail cards ----
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
  const cardCount = await page.locator("[data-testid='landing-vendor-card']").count();
  check("A0: landing vendor cards render", cardCount > 0, `n=${cardCount}`);
  if (cardCount > 0) {
    const geom = await page.evaluate(`(() => {
      const card = document.querySelector("[data-testid='landing-vendor-card']");
      const cb = card.getBoundingClientRect();
      const btns = [...card.querySelectorAll(".vendor-save button")];
      const status = card.querySelector(".vendor-status");
      const sr = status ? status.getBoundingClientRect() : null;
      const out = [];
      for (const b of btns) {
        const r = b.getBoundingClientRect();
        const inCard = r.left >= cb.left - 1 && r.right <= cb.right + 1 && r.top >= cb.top - 1 && r.bottom <= cb.bottom + 1;
        const hitsStatus = sr ? !(r.right <= sr.left || r.left >= sr.right || r.bottom <= sr.top || r.top >= sr.bottom) : false;
        out.push({ w: Math.round(r.width), h: Math.round(r.height), inCard, hitsStatus });
      }
      return JSON.stringify({ btnCount: btns.length, out });
    })()`);
    const g = JSON.parse(geom);
    check("A1: two compact icon buttons (heart + follow)", g.btnCount === 2, `n=${g.btnCount}`);
    check("A2: buttons inside the card box", g.out.every((b: { inCard: boolean }) => b.inCard), JSON.stringify(g.out));
    check("A3: buttons ~30px compact (no pill overflow)", g.out.every((b: { w: number; h: number }) => b.w <= 34 && b.h <= 34), JSON.stringify(g.out.map((b: { w: number; h: number }) => b.w + "x" + b.h)));
    check("A4: no collision with status badge", g.out.every((b: { hitsStatus: boolean }) => !b.hitsStatus));
    // follow click works (auth gate redirect for anon = /login)
    await page.locator("[data-testid='landing-vendor-card'] .vendor-save button").nth(1).click();
    await page.waitForURL(/\/login/, { timeout: 15000 }).catch(() => {});
    const url = page.url();
    check("A5: follow tap acts (auth-gated to /login for anon)", url.includes("/login"), url.slice(0, 60));
  }

  // ---- B: empty-string image guard ----
  await page.goto(`${BASE}/vendor/${vendorId}`, { waitUntil: "networkidle", timeout: 60000 });
  const badStore = await page.evaluate(`(() => {
    return [...document.querySelectorAll("img")].filter(i => !i.getAttribute("src") || i.getAttribute("src").trim() === "").length;
  })()`);
  check("B1: storefront grid — no src-less img", badStore === 0, `n=${badStore}`);
  await page.goto(`${BASE}/listing/${listingId}`, { waitUntil: "networkidle", timeout: 60000 });
  const badDetail = await page.evaluate(`(() => {
    return [...document.querySelectorAll("img")].filter(i => !i.getAttribute("src") || i.getAttribute("src").trim() === "").length;
  })()`);
  check("B2: listing detail gallery — no src-less img", badDetail === 0, `n=${badDetail}`);
  // the valid photo still renders (filter didn't nuke the good one)
  const goodImg = await page.evaluate(`(() => {
    return [...document.querySelectorAll("[data-testid='listing-detail-track'] img")].map(i => i.getAttribute("src")).filter(Boolean).length;
  })()`);
  check("B3: valid photo survives the filter", goodImg === 1, `n=${goodImg}`);

  await browser.close();
} catch (e) {
  results.push("FAIL exception — " + String(e).slice(0, 300));
} finally {
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
