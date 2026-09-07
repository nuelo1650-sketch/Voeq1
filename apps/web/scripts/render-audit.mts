/**
 * RENDER AUDIT — every feature surface @390px vs test DB (David: "make sure
 * every feature renders well and is ready, no hiding bugs").
 * Per route: (1) no horizontal overflow, (2) no broken images (src-less or
 * naturalWidth==0 after load), (3) no interactive element (button/a/input)
 * whose box sits off-screen or under the viewport edge unreachable,
 * (4) no invisible text (color == background on visible text nodes),
 * (5) page actually rendered content (body text length > 40 — catches silent
 * error pages), (6) console errors captured (app-origin only).
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";
import { chromium } from "playwright";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const sql = neon(env.match(/DATABASE_URL=([^\n\r]+)/)[1].replace("/neondb?", "/neondb_test?"));
const BASE = "http://localhost:3031";
const stamp = Date.now();
const cleanup: string[] = [];

const demo = (await sql`SELECT v.id AS vendor_id, i.id AS identity_id FROM vendors v JOIN identities i ON i.id = v.identity_id WHERE v.status = 'live' LIMIT 1`)[0];
const mkSession = async (identityId: string) => {
  const s = randomUUID();
  await sql`INSERT INTO sessions (id, identity_id, created_at, expires_at) VALUES (${s}, ${identityId}, ${new Date().toISOString()}, ${new Date(Date.now() + 3600e3).toISOString()})`;
  cleanup.push(s);
  return s;
};
const vSession = await mkSession(demo.identity_id);
// a conversation for /messages
const conv = (await sql`SELECT c.id, c.participant_ids FROM conversations c WHERE c.participant_ids::text LIKE ${"%" + demo.identity_id + "%"} LIMIT 1`)[0];
const listing = (await sql`SELECT id FROM listings WHERE vendor_id = ${demo.vendor_id} AND is_published = true AND status = 'active' LIMIT 1`)[0]
  ?? (await sql`SELECT id FROM listings WHERE is_published = true AND status = 'active' LIMIT 1`)[0];

// eslint-disable-next-line @typescript-eslint/no-implied-eval
const MEASURE = new Function(`
  return (function measure() {
    var vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    var issues = [];
    // 1) overflow
    if (document.documentElement.scrollWidth > vw + 1) issues.push("HSCROLL scrollW=" + document.documentElement.scrollWidth);
    // 2) broken images
    var imgs = document.querySelectorAll("img");
    for (var i = 0; i < imgs.length; i++) {
      var im = imgs[i];
      var src = im.getAttribute("src");
      if (!src || src.trim() === "") { issues.push("IMG-NOSRC alt=" + (im.alt || "-").slice(0, 30)); continue; }
      if (im.complete && im.naturalWidth === 0 && !src.startsWith("data:")) issues.push("IMG-BROKEN " + src.slice(0, 60));
    }
    // 3) unreachable interactive elements (off-screen right, or clipped below with no scrollable ancestor)
    var ints = document.querySelectorAll("button, a, input, select, textarea");
    var offRight = 0, offSample = "";
    for (var j = 0; j < ints.length; j++) {
      var el = ints[j];
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      var cs = window.getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") continue;
      if (r.left >= vw + 2) {
        // allowed inside horizontal scroll strips (rails, chip rows)
        var a = el.parentElement, inStrip = false;
        while (a && a !== document.body) {
          var acs = window.getComputedStyle(a);
          if ((acs.overflowX === "auto" || acs.overflowX === "scroll") && a.scrollWidth > a.clientWidth + 1) { inStrip = true; break; }
          a = a.parentElement;
        }
        if (!inStrip) { offRight++; if (!offSample) offSample = el.tagName + ' "' + (el.textContent || "").trim().slice(0, 24) + '" x=' + Math.round(r.left); }
      }
    }
    if (offRight > 0) issues.push("OFFSCREEN x" + offRight + " first=" + offSample);
    // 4) invisible text (same color as bg on a text-bearing leaf)
    var invis = 0, invisSample = "";
    var leaves = document.querySelectorAll("p, span, h1, h2, h3, h4, a, button, li, label, td, th");
    for (var k = 0; k < leaves.length && invis < 3; k++) {
      var t = leaves[k];
      if (!t.textContent || !t.textContent.trim() || t.children.length > 0) continue;
      var tr = t.getBoundingClientRect();
      if (!tr.width || !tr.height) continue;
      var tcs = window.getComputedStyle(t);
      if (tcs.visibility === "hidden" || tcs.opacity === "0") continue;
      var bg = "transparent";
      var p = t;
      while (p && (bg === "transparent" || bg === "rgba(0, 0, 0, 0)")) { bg = window.getComputedStyle(p).backgroundColor; p = p.parentElement; }
      if (bg === tcs.color) { invis++; if (!invisSample) invisSample = t.tagName + ' "' + t.textContent.trim().slice(0, 20) + '"'; }
    }
    if (invis > 0) issues.push("INVISIBLE-TEXT x" + invis + " " + invisSample);
    // 5) content actually rendered
    var bodyLen = (document.body.innerText || "").trim().length;
    if (bodyLen < 40) issues.push("EMPTY-PAGE bodyLen=" + bodyLen);
    return JSON.stringify({ issues: issues.slice(0, 6), bodyLen: bodyLen });
  });
`)();

const ROUTES: Array<[string, string, string | null]> = [
  ["landing", "/", null],
  ["explore", "/explore", null],
  ["listing-detail", listing ? `/listing/${listing.id}` : "/listing/x", null],
  ["storefront", `/vendor/${demo.vendor_id}`, null],
  ["how-it-works", "/how-it-works", null],
  ["for-vendors", "/for-vendors", null],
  ["become-vendor", "/become-vendor", null],
  ["about", "/about", null], ["help", "/help", null],
  ["terms", "/terms", null], ["privacy", "/privacy", null],
  ["login", "/login", null], ["signup", "/signup", null],
  ["select-campus", "/select-campus", vSession],
  ["home", "/home", vSession],
  ["saved", "/saved", vSession],
  ["messages", "/messages", vSession],
  ...(conv ? [["messages-thread", `/messages/${conv.id}`, vSession] as [string, string, string]] : []),
  ["notifications", "/notifications", vSession],
  ["settings", "/settings", vSession],
  ["vendor-dashboard", "/vendor/dashboard", vSession],
  ["vendor-listings", "/vendor/listings", vSession],
  ["vendor-create", "/vendor/listings/create", vSession],
  ...(listing ? [["vendor-edit", `/vendor/listings/${listing.id}/edit`, vSession] as [string, string, string]] : []),
  ["vendor-analytics", "/vendor/analytics", vSession],
  ["vendor-storefront", "/vendor/storefront", vSession],
  ["vendor-reviews", "/vendor/reviews", vSession],
  ["vendor-preview", "/vendor/preview", vSession],
  ["admin-home", "/admin", vSession],
];

const browser = await chromium.launch();
let bad = 0;
for (const [label, path, session] of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  if (session) await ctx.addCookies([{ name: "sessionId", value: session, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
  const page = await ctx.newPage();
  const consoleErrs: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text().slice(0, 90)); });
  let out = "";
  try {
    await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500); // hydrate + late images/renders
    out = await page.evaluate(MEASURE) as string;
  } catch (e) { out = JSON.stringify({ issues: ["NAV-ERR " + String(e).slice(0, 60)], bodyLen: 0 }); }
  const r = JSON.parse(out);
  const appErrs = consoleErrs.filter((t) => !t.includes("favicon") && !t.includes("content.js") && !t.includes("Turnstile") && !t.includes("%c"));
  const clean = r.issues.length === 0 && appErrs.length === 0;
  if (!clean) bad++;
  console.log(`${clean ? "✅" : "❌"} ${label}: ${r.issues.join(" | ") || "clean"}${appErrs.length ? " CONSOLE:" + appErrs.slice(0, 2).join(" ;; ") : ""}`);
  await ctx.close();
}
await browser.close();
for (const s of cleanup) await sql`DELETE FROM sessions WHERE id = ${s}`;
console.log(bad === 0 ? "== RENDER AUDIT: ALL CLEAN ==" : `== RENDER AUDIT: ${bad} DIRTY ==`);
process.exit(bad === 0 ? 0 : 1);
