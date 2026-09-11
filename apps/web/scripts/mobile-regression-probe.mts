/** r81 final probe v2: self-seeded fixture (identity+live vendor+2-image listing) exercises dropdown + swipe track */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";
import { chromium } from "playwright";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const sql = neon(env.match(/DATABASE_URL=([^\n\r]+)/)[1].replace("/neondb?", "/neondb_test?"));
const stamp = Date.now();
const now = new Date().toISOString();

const shopperId = randomUUID();
await sql`INSERT INTO identities (id, email, name, role, account_status, email_verified, method, consent, created_at, updated_at)
VALUES (${shopperId}, ${`r81f-${stamp}@t.dev`}, 'R81F Shopper', 'shopper', 'active', true, 'email', ${JSON.stringify([{ termsVersion: "1.0", privacyVersion: "1.0", acceptedAt: now, method: "email" }])}::jsonb, ${now}, ${now})`;
const s = randomUUID();
await sql`INSERT INTO sessions (id, identity_id, created_at, expires_at) VALUES (${s}, ${shopperId}, ${now}, ${new Date(Date.now() + 600e3).toISOString()})`;

// fixture vendor (live) + published 2-image listing
const vendorId = `r81f-vendor-${stamp}`;
const cat = (await sql`SELECT id FROM categories LIMIT 1`)[0];
await sql`INSERT INTO vendors (id, name, handle, campus, category_ids, status, verified, slug)
VALUES (${vendorId}, ${"R81F Vendor"}, ${`r81f-${stamp}`}, ${"nmu-okerenkoko"}, ${JSON.stringify([cat.id])}::jsonb, 'live', true, ${`r81f-${stamp}`})`;
const listingId = `r81f-multi-${stamp}`;
await sql`INSERT INTO listings (id, vendor_id, title, price_minor, is_published, images, price_min_minor, price_max_minor, category_id, description, status, is_featured)
VALUES (${listingId}, ${vendorId}, ${"R81F Multi Photo"}, 500, true,
  ${JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg", "https://res.cloudinary.com/demo/image/upload/sample2.jpg"])}::jsonb,
  500, null, ${cat.id}, ${"seeded by r81 final probe"}, 'active', false)`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addCookies([{ name: "sessionId", value: s, domain: "localhost", path: "/" }]);
const page = await ctx.newPage();
let fails = 0;
const check = (name: string, ok: boolean, detail: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${detail}`); if (!ok) fails++; };

// --- dropdown: on-screen sheet (8px inset by design) ---
await page.goto("http://localhost:3031/messages", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const bell = page.locator('button[aria-label^="Notifications"]');
check("bell present", (await bell.count()) > 0, `count=${await bell.count()}`);
if (await bell.count() > 0) {
  await bell.first().click();
  await page.waitForTimeout(700);
  const dd = await page.evaluate(`(() => {
    var el = document.querySelector(".notification-dropdown");
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), width: Math.round(r.width), vw: document.documentElement.clientWidth };
  })()`);
  check("dropdown fully on-screen", !!dd && dd.left >= 0 && dd.right <= dd.vw + 1, JSON.stringify(dd));
}

// --- swipe track on explore (seeded 2-image listing) ---
await page.goto("http://localhost:3031/explore?campus=nmu-okerenkoko", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const exp = await page.evaluate(`(() => {
  var cards = document.querySelectorAll('[data-testid="listing-card"]').length;
  var tracks = document.querySelectorAll(".voeq-card-track").length;
  var dots = document.querySelectorAll(".voeq-card-dots").length;
  var trackImgs = document.querySelectorAll(".voeq-card-track img").length;
  var t = document.querySelector(".voeq-card-track");
  var scrollable = t ? t.scrollWidth > t.clientWidth + 1 : false;
  return { cards: cards, tracks: tracks, dots: dots, trackImgs: trackImgs, scrollable: scrollable };
})()`);
check("multi-image card renders track", exp.tracks >= 1 && exp.trackImgs >= 2, JSON.stringify(exp));
check("track horizontally scrollable", exp.scrollable, JSON.stringify(exp));
check("dots render", exp.dots >= 1, JSON.stringify(exp));

// swipe: scroll the track, confirm active dot advances
const dotMoved = await page.evaluate(`(() => {
  var t = document.querySelector(".voeq-card-track");
  if (!t) return "no-track";
  t.scrollLeft = t.clientWidth;
  return new Promise(function(res) { setTimeout(function() {
    var dots = t.closest(".voeq-card-image").querySelectorAll(".voeq-card-dot");
    var activeIdx = -1;
    dots.forEach(function(d, i) { if (d.classList.contains("is-active")) activeIdx = i; });
    res("active=" + activeIdx + " of " + dots.length);
  }, 600); });
})()`);
check("swipe advances active dot", dotMoved === "active=1 of 2", String(dotMoved));

await browser.close();
await sql`DELETE FROM listings WHERE id = ${listingId}`;
await sql`DELETE FROM vendors WHERE id = ${vendorId}`;
await sql`DELETE FROM sessions WHERE id = ${s}`;
await sql`DELETE FROM identities WHERE id = ${shopperId}`;
console.log(fails === 0 ? "FINAL PROBE: ALL PASS" : `FINAL PROBE: ${fails} FAILS`);
process.exit(fails === 0 ? 0 : 1);
