/**
 * POST-FIX RE-SWEEP v2 — the escape function is passed as a STRING-templated
 * evaluate (no closure over outer scope) to dodge the esbuild __name issue.
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { randomUUID } from "crypto";
import { chromium } from "playwright";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const sql = neon(env.match(/DATABASE_URL=([^\n\r]+)/)[1].replace("/neondb?", "/neondb_test?"));
const BASE = "http://localhost:3031";
const stamp = Date.now();
const cleanupSessions: string[] = [];
const cleanupIds: string[] = [];

const demo = (await sql`SELECT v.id AS vendor_id, i.id AS identity_id FROM vendors v JOIN identities i ON i.id = v.identity_id WHERE v.status = 'live' LIMIT 1`)[0] ?? { vendor_id: "v1", identity_id: "seed" };
const mkSession = async (identityId: string) => {
  const s = randomUUID();
  await sql`INSERT INTO sessions (id, identity_id, created_at, expires_at) VALUES (${s}, ${identityId}, ${new Date().toISOString()}, ${new Date(Date.now() + 3600e3).toISOString()})`;
  cleanupSessions.push(s);
  return s;
};
const vSession = await mkSession(demo.identity_id);
const shopperId = randomUUID();
await sql`INSERT INTO identities (id, email, name, role, account_status, email_verified, method, consent, created_at, updated_at)
VALUES (${shopperId}, ${`rs2-shopper-${stamp}@t.dev`}, 'RS2 Shopper', 'shopper', 'active', true, 'email', ${JSON.stringify([{ termsVersion: "1.0", privacyVersion: "1.0", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, ${new Date().toISOString()}, ${new Date().toISOString()})`;
cleanupIds.push(shopperId);
const sSession = await mkSession(shopperId);
const adminId = randomUUID();
await sql`INSERT INTO identities (id, email, name, role, staff_role, account_status, email_verified, method, consent, created_at, updated_at)
VALUES (${adminId}, ${`rs2-${stamp}@t.dev`}, 'RS2 Admin', 'shopper', 'super_admin', 'active', true, 'email', ${JSON.stringify([{ termsVersion: "1.0", privacyVersion: "1.0", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, ${new Date().toISOString()}, ${new Date().toISOString()})`;
cleanupIds.push(adminId);
const aSession = await mkSession(adminId);

const SHOPPER2 = (await sql`SELECT id FROM identities WHERE role = 'shopper' LIMIT 1`)[0];
const rid = "rs2-resp-" + stamp;
await sql`INSERT INTO reviews (id, vendor_id, author_id, rating, body, created_at, response)
VALUES (${rid}, ${demo.vendor_id}, ${SHOPPER2.id}, 5, ${"Excellent!"}, ${new Date().toISOString()},
${JSON.stringify({ body: "ThankyouSoMuchForYourKindWordsWeAppreciateCustomersLikeYouImmenselyAndLookForwardToServingYouAgainVerySoonInOurStore", createdAt: new Date().toISOString(), editedAt: null })}::jsonb)`;

const listing = (await sql`SELECT id FROM listings WHERE vendor_id = ${demo.vendor_id} AND is_published = true LIMIT 1`)[0];

// eslint-disable-next-line @typescript-eslint/no-implied-eval
const MEASURE = new Function(`
  return (function measure() {
    var vw = document.documentElement.clientWidth;
    var issues = [];
    function inScrollableStrip(el) {
      var a = el.parentElement;
      while (a && a !== document.body) {
        var cs = window.getComputedStyle(a);
        if ((cs.overflowX === "auto" || cs.overflowX === "scroll") && a.scrollWidth > a.clientWidth + 1) return true;
        a = a.parentElement;
      }
      return false;
    }
    var all = document.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!(el instanceof HTMLElement)) continue;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (r.right > vw + 1) {
        var pr = el.parentElement ? el.parentElement.getBoundingClientRect() : null;
        if ((!pr || pr.right <= vw + 1) && !inScrollableStrip(el)) {
          issues.push("<" + el.tagName.toLowerCase() + "> r=" + Math.round(r.right) + ' "' + (el.textContent || "").trim().slice(0, 24) + '"');
        }
      }
    }
    return { scrollW: document.documentElement.scrollWidth, vw: vw, hScroll: document.documentElement.scrollWidth > vw + 1, issues: issues.slice(0, 4) };
  });
`)();

const ROUTES: Array<[string, string, string | null]> = [
  ["landing", "/", null], ["explore", "/explore", null], ["categories", "/c/categories", null],
  ["listing-detail", `/listing/${listing?.id ?? "x"}`, null],
  ["storefront", `/vendor/${demo.vendor_id}`, null],
  ["how-it-works", "/how-it-works", null], ["for-vendors", "/for-vendors", null],
  ["about", "/about", null], ["contact", "/contact", null], ["faq", "/faq", null], ["help", "/help", null],
  ["terms", "/terms", null], ["privacy", "/privacy", null],
  ["login", "/login", null], ["signup", "/signup", null],
  ["settings", "/settings", sSession], ["onboarding-shopper", "/onboarding/shopper", sSession],
  ["vendor-dashboard", "/vendor/dashboard", vSession], ["vendor-listings", "/vendor/listings", vSession],
  ["vendor-create-listing", "/vendor/listings/create", vSession], ["vendor-analytics", "/vendor/analytics", vSession],
  ["vendor-storefront-settings", "/vendor/storefront", vSession], ["vendor-reviews", "/vendor/reviews", vSession],
  ["vendor-edit-listing", listing ? `/vendor/listings/${listing.id}/edit` : "/vendor/listings", vSession],
  ["admin-moderation", "/staff/moderation", aSession], ["admin-users", "/staff/users", aSession],
  ["admin-listings", "/staff/listings", aSession], ["admin-audit", "/staff/audit", aSession],
  ["admin-team", "/staff/team", aSession], ["admin-home", "/admin", aSession],
];

const browser = await chromium.launch();
mkdirSync("C:/Users/Legacy/Documents/voeq/Temp/mobile-sweep", { recursive: true });
const bad: string[] = [];

for (const [label, path, session] of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  if (session) await ctx.addCookies([{ name: "sessionId", value: session, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 40000 });
    await page.waitForTimeout(3200);
    const rep = await page.evaluate(MEASURE) as { scrollW: number; vw: number; hScroll: boolean; issues: string[] };
    const ok = !rep.hScroll && rep.issues.length === 0;
    console.log(`${ok ? "✅" : "🔴"} ${label}: scrollW=${rep.scrollW}/${rep.vw}${rep.issues.length ? " " + JSON.stringify(rep.issues).slice(0, 140) : ""}`);
    if (!ok) bad.push(label);
    await page.screenshot({ path: `C:/Users/Legacy/Documents/voeq/Temp/mobile-sweep/final-${label}-390.png`, fullPage: rep.hScroll });
  } catch (e) {
    console.log(`❓ ${label}: ${String(e).slice(0, 70)}`);
    bad.push(label);
  } finally {
    await ctx.close();
  }
}

await sql`DELETE FROM reviews WHERE id = ${rid}`;
for (const s of cleanupSessions) await sql`DELETE FROM sessions WHERE id = ${s}`;
for (const i of cleanupIds) await sql`DELETE FROM identities WHERE id = ${i}`;
await browser.close();
writeFileSync("C:/Users/Legacy/Documents/voeq/Temp/mobile-sweep/final-verify.json", JSON.stringify({ bad }, null, 2));
console.log(`\n== FINAL RESWEEP: ${ROUTES.length - bad.length}/${ROUTES.length} clean${bad.length ? " — STILL BAD: " + bad.join(", ") : " — ALL CLEAN"} ==`);
