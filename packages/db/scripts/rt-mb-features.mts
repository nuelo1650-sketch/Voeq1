/** ROUND-TRIP FEATURES: follow / like / save / comment post / socials display /
 *  contact-CTA routing. Uses real sessions on the test DB, real UI clicks in
 *  Playwright. READ-ONLY claims: every assertion = a request/response I
 *  actually observed. */
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { hashSync } from "argon2";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "").replace("/neondb?", "/neondb_test?");
const sql = neon(dbUrl);

const stamp = "ft" + Date.now().toString(36);
const consent = JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }]);
const IMG = "https://picsum.photos/id/429/900/600";
const sess = "ft-s-" + stamp;
const iid = "ft-i-" + stamp;
const vid = "ft-v-" + stamp;
const lid = "ft-l-" + stamp;

let failures = 0;
const check = (n: string, ok: boolean, d = "") => {
  console.log(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);
  if (!ok) failures++;
};

try {
  // shopper identity (no vendor) + session
  await sql`INSERT INTO identities (id, email, name, role, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${`ft-${stamp}@t.dev`}, 'FT Shopper', 'shopper', 'nmu-okerenkoko', 'active', true, ${consent}::jsonb, now(), now())`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${iid}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;
  // vendor + 1 published listing WITH socials populated (the thing prod lacks)
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${'ft-vi-' + stamp}, ${`ftv-${stamp}@t.dev`}, 'FT Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true, ${consent}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at, socials)
    VALUES (${vid}, ${'ft-vi-' + stamp}, 'FT Vendor', ${'ftv' + stamp}, ${'fts' + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date(Date.now() - 400 * 864e5).toISOString()},
      ${JSON.stringify({ instagram: "ftvendor", whatsappChannel: "https://www.whatsapp.com/channel/0029Vb8u4Md6mYPON8gMpi3i" })}::jsonb)`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_min_minor, price_minor, is_published, status, images, is_featured, created_at, source, short_description)
    VALUES (${lid}, ${vid}, 'FT Test Listing', 'd', 'food', 450000, 450000, true, 'active', ${JSON.stringify([IMG, IMG])}::jsonb, false, now(), null::text, 'd')`;
  // sibling listing on the SAME vendor — "More from" needs >0 same-vendor items
  const lid2 = "ft-l2-" + stamp;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_min_minor, price_minor, is_published, status, images, is_featured, created_at, source, short_description)
    VALUES (${lid2}, ${vid}, 'FT Second Listing', 'd', 'food', 250000, 250000, true, 'active', ${JSON.stringify([IMG])}::jsonb, false, now(), null::text, 'd')`;

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addCookies([{ name: "sessionId", value: sess, url: "http://localhost:3031" }]);
  const page = await ctx.newPage();

  // 1) storefront: socials render + follow works
  await page.goto(`http://localhost:3031/vendor/${vid}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="storefront-hero"], [data-testid="storefront-contact-cta"]', { timeout: 30000 });
  await page.waitForTimeout(1500);
  const socials = await page.$$eval('[data-testid^="storefront-social"]', (els) => els.map((e) => e.textContent?.trim().slice(0, 22)));
  check("F1 socials render on storefront", socials.length >= 2, JSON.stringify(socials));
  const igHref = await page.$eval('[data-testid="storefront-social-instagram"]', (e) => (e as HTMLAnchorElement).getAttribute("href")).catch(() => null);
  check("F2 instagram href is a real URL", !!igHref && igHref.includes("instagram.com"), String(igHref));
  const waHref = await page.$eval('[data-testid="storefront-social-whatsapp"]', (e) => (e as HTMLAnchorElement).getAttribute("href")).catch(() => null);
  check("F3 whatsapp channel href canonical", !!waHref && waHref.includes("www.whatsapp.com/channel"), String(waHref).slice(0, 50));

  const followBtn = await page.$('.vs-follow button, button.vs-follow, .storefront-follow-btn');
  if (followBtn) {
    const resp = page.waitForResponse((r) => r.url().includes("/api/follow") && r.request().method() === "POST", { timeout: 8000 }).catch(() => null);
    await followBtn.click();
    const r = await resp;
    const st = r ? r.status() : -1;
    check("F4 follow POST succeeds", st >= 200 && st < 300, `status=${st}`);
    if (st >= 200 && st < 300) {
      const rows = await sql`SELECT COUNT(*)::int AS n FROM follows WHERE vendor_id = ${vid} AND follower_id = ${iid}`;
      check("F5 follow row exists in DB", rows[0].n === 1, `n=${rows[0].n}`);
      const rp2 = page.waitForResponse((r) => r.url().includes("/api/follow") && r.request().method() === "POST", { timeout: 8000 }).catch(() => null);
      await followBtn.click(); // unfollow
      const r2 = await rp2;
      console.log("   unfollow POST status:", r2 ? r2.status() : "none");
      await page.waitForTimeout(1200);
      const rows2 = await sql`SELECT COUNT(*)::int AS n FROM follows WHERE vendor_id = ${vid} AND follower_id = ${iid}`;
      check("F6 unfollow removes row", rows2[0].n === 0, `n=${rows2[0].n}`);
    }
  } else check("F4 follow button present", false);

  // 2) listing detail: like + save + comment + rails
  await page.goto(`http://localhost:3031/listing/${lid}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="listing-detail"]', { timeout: 30000 });
  await page.waitForTimeout(2500);
  const likeBtn = await page.$('.listing-detail-like, button[aria-label="Like"], button[aria-label="Unlike"]');
  if (likeBtn) {
    const rp = page.waitForResponse((r) => r.url().includes("/api/like") && r.request().method() === "POST", { timeout: 8000 }).catch(() => null);
    await likeBtn.click();
    const r = await rp;
    check("L1 like POST succeeds", r ? r.status() === 200 : false, r ? `status=${r.status()}` : "no POST fired");
  } else check("L1 like button present", false);

  const saveBtn = await page.$('.listing-detail-save, [data-testid="save-button"]');
  if (saveBtn) {
    const rp = page.waitForResponse((r) => r.url().includes("/api/save") && r.request().method() === "POST", { timeout: 8000 }).catch(() => null);
    await saveBtn.click();
    const r = await rp;
    check("L2 save POST succeeds", r ? r.status() === 200 : false, r ? `status=${r.status()}` : "no POST fired");
  } else check("L2 save button present", false);

  const box = await page.$('[data-testid="comment-body"]');
  if (box) {
    await box.fill("FT round-trip comment " + stamp);
    const rp = page.waitForResponse((r) => r.url().includes("/comments") && r.request().method() === "POST", { timeout: 8000 }).catch(() => null);
    await page.keyboard.press("Enter").catch(() => {});
    // fallback submit via button
    const submit = await page.$('[data-testid="comment-submit"]');
    if (submit) await submit.click();
    const r = await rp;
    check("L3 comment POST succeeds", r ? r.status() < 300 : false, r ? `status=${r.status()}` : "no POST fired");
  } else check("L3 comment input present", false);

  // rails render with same-vendor + same-category data present
  await page.waitForFunction(() => [...document.querySelectorAll('h2')].some(h => /More from/i.test(h.textContent || '')), { timeout: 8000 }).catch(() => {});
  const moreVendor = await page.evaluate(`(() => [...document.querySelectorAll('h2')].some(h => /More from/i.test(h.textContent||'')))()`);
  check("L4 'More from' rail renders", moreVendor,
    moreVendor ? "" : "H2s: " + await page.evaluate(`(() => [...document.querySelectorAll('h2')].map(h=>h.textContent?.trim().slice(0,25)).join('/'))()`));
  await page.screenshot({ path: "Temp/feat-listing-detail.png", fullPage: true });

  // 3) contact CTA -> messaging
  await page.goto(`http://localhost:3031/vendor/${vid}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('[data-testid="storefront-contact-cta"]', { timeout: 60000 });
  await page.waitForTimeout(3000); // hydration: SSR HTML exists before handlers
  const rp3 = page.waitForResponse((r) => r.url().includes("/api/conversations") && r.request().method() === "POST", { timeout: 15000 }).catch(() => null);
  await page.click('[data-testid="storefront-contact-cta"]');
  const r3resp = await rp3;
  console.log("   contact API response:", r3resp ? `POST /api/conversations -> ${r3resp.status()}` : "NONE");
  // poll for the client-side route change (dev-compile can lag behind the POST)
  await page.waitForFunction(() => location.pathname.startsWith("/messages/"), { timeout: 15000 }).catch(() => {});
  check("C1 contact routes to a real conversation URL", page.url().includes("/messages/") && !page.url().includes("/undefined"), page.url().replace("http://localhost:3031", ""));

  await ctx.close();
  await browser.close();
} finally {
  await sql`DELETE FROM listings WHERE id LIKE ${`ft-l%-${stamp}`}`.catch(() => {});
  await sql`DELETE FROM comments WHERE body LIKE ${`FT round-trip comment ${stamp}%`}`.catch(() => {});
  await sql`DELETE FROM likes WHERE target_id = ${lid}`.catch(() => {});
  await sql`DELETE FROM wishlist_items WHERE listing_id = ${lid}`.catch(() => {});
  await sql`DELETE FROM follows WHERE vendor_id = ${vid}`.catch(() => {});
  await sql`DELETE FROM conversations WHERE vendor_id = ${vid}`.catch(() => {});
  await sql`DELETE FROM page_events WHERE ref_id = ${lid} OR path LIKE ${`%${lid}%`}`.catch(() => {});
  await sql`DELETE FROM listings WHERE id = ${lid}`;
  await sql`DELETE FROM vendors WHERE id = ${vid}`;
  await sql`DELETE FROM identities WHERE id IN (${iid}, ${"ft-vi-" + stamp})`;
  console.log("cleanup done");
}
console.log(failures === 0 ? "ALL PASS" : `FAILED: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
