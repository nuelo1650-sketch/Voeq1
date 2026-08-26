/**
 * D0c visual audit v2 — per voeq-e2e-harness skill:
 *  - warm every route FIRST (compiles happen before any session exists)
 *  - fresh dev session per role×width, created moments before use
 *  - retry once with a brand-new session if a page bounces to /login
 *  - domcontentloaded + settle (networkidle hangs on polling pages)
 * Run: node scripts/d0c-screenshots.mjs
 */
import { chromium, request as pwRequest } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.D0C_BASE ?? "http://localhost:3001";
const OUT = path.resolve("audit-shots");
fs.mkdirSync(OUT, { recursive: true });

const WIDTHS = [
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];

const PUBLIC_SCREENS = [
  ["/", "landing"],
  ["/login", "login"],
  ["/signup", "signup"],
  ["/forgot-password", "forgot-password"],
  ["/verify-otp?email=test@example.com", "verify-otp"],
  ["/consent", "consent"],
  ["/select-campus", "select-campus"],
  ["/reset-password", "reset-password"],
  ["/account-state", "account-state"],
  ["/explore", "explore"],
  ["/become-vendor", "become-vendor"],
  ["/vendor/v1", "public-storefront-v1"],
  ["/listing/l1", "listing-l1"],
  ["/terms", "terms"],
  ["/privacy", "privacy"],
];

// shopper session also drives the vendor WIZARD shot (identity w/o vendorId -> step 1)
const SHOPPER_SCREENS = [
  ["/home", "home"],
  ["/settings", "settings"],
  ["/messages", "messages"],
  ["/notifications", "notifications"],
  ["/onboarding/shopper", "onboarding-shopper"],
  ["/onboarding/vendor", "onboarding-vendor-wizard"],
  ["/saved", "saved-404-check"],
];

const VENDOR_SCREENS = [
  ["/vendor/dashboard", "vendor-dashboard"],
  ["/vendor/storefront", "vendor-storefront"],
  ["/vendor/analytics", "vendor-analytics"],
  ["/vendor/reviews", "vendor-reviews"],
  ["/vendor/listings/create", "vendor-listing-create"],
];

const STAFF_SCREENS = [
  ["/staff", "staff-dashboard"],
  ["/staff/moderation", "staff-moderation"],
  ["/staff/analytics", "staff-analytics"],
  ["/staff/config", "staff-config"],
  ["/staff/audit", "staff-audit"],
  ["/admin", "admin"],
];

// ---- Phase 1: warm every route + dev endpoints (all compiles happen here) ----
const warmCtx = await pwRequest.newContext();
for (const ep of ["/api/dev/shopper-session", "/api/dev/vendor-session", "/api/dev/admin-session"]) {
  try { await warmCtx.post(`${BASE}${ep}`, { data: {}, timeout: 45000 }); } catch {}
}
// client-side API routes (compiled lazily on first fetch — must warm before sessions)
const API_ROUTES = [
  "/api/auth/consent", "/api/auth/forgot-password", "/api/auth/login", "/api/auth/logout",
  "/api/auth/resend-otp", "/api/auth/reset-password", "/api/auth/set-campus",
  "/api/auth/signout-all", "/api/auth/signup", "/api/auth/status", "/api/auth/verify-otp",
  "/api/conversations", "/api/follow", "/api/home", "/api/listings", "/api/me/preferences",
  "/api/notifications", "/api/notifications/read-all", "/api/onboarding/shopper/complete",
  "/api/onboarding/vendor/step-1", "/api/reports", "/api/reviews", "/api/saved",
  "/api/settings/campus", "/api/settings/delete-account", "/api/settings/notifications",
  "/api/settings/profile", "/api/staff/audit", "/api/staff/cases", "/api/staff/impersonate/end",
  "/api/vendor/agreement", "/api/vendor/analytics", "/api/vendor/followers", "/api/vendor/hours",
  "/api/vendor/identity", "/api/vendor/photo", "/api/vendor/reviews", "/api/vendor/socials",
];
for (const u of API_ROUTES) {
  try { await warmCtx.get(`${BASE}${u}`, { maxRedirects: 0, timeout: 45000 }); } catch {}
}
for (const [u] of [...PUBLIC_SCREENS, ...SHOPPER_SCREENS, ...VENDOR_SCREENS, ...STAFF_SCREENS]) {
  try {
    const r = await warmCtx.get(`${BASE}${u}`, { maxRedirects: 0, timeout: 45000 });
    console.log(`warm ${r.status()} ${u}`);
  } catch (e) {
    console.log(`warm ERR ${u}: ${e.message.split("\n")[0]}`);
  }
}
await warmCtx.dispose();

// ---- Phase 2: fresh sessions + screenshots ----
async function freshCookie(endpoint, body) {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(`${BASE}${endpoint}`, { data: body ?? {}, timeout: 30000 });
  const setCookie = res.headers()["set-cookie"];
  await ctx.dispose();
  if (!setCookie) throw new Error(`no cookie from ${endpoint}: ${res.status()}`);
  const m = setCookie.match(/sessionId=([^;]+)/);
  if (!m) throw new Error(`no sessionId from ${endpoint}`);
  return { name: "sessionId", value: m[1], domain: "localhost", path: "/" };
}

const browser = await chromium.launch();

async function tryShoot(page, url, file) {
  try {
    await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1000);
    const finalUrl = page.url();
    await page.screenshot({ path: file, fullPage: true });
    return { finalUrl, loginRedirect: finalUrl.includes("/login") };
  } catch (e) {
    try { await page.screenshot({ path: file }); } catch {}
    return { finalUrl: page.url(), loginRedirect: false, error: e.message.split("\n")[0] };
  }
}

async function shootPublic() {
  for (const { name, width, height } of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    const page = await ctx.newPage();
    for (const [url, label] of PUBLIC_SCREENS) {
      const r = await tryShoot(page, url, path.join(OUT, `pub-${label}-${name}.png`));
      console.log(`${r.error ? "ERR" : "OK "} pub/${label}@${name} -> ${r.finalUrl}${r.error ? " | " + r.error : ""}`);
    }
    await ctx.close();
  }
}

async function shootAuthed(roleLabel, screens, endpoint, body) {
  for (const { name, width, height } of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    const page = await ctx.newPage();
    let cookie = await freshCookie(endpoint, body);
    await ctx.addCookies([cookie]);
    for (const [url, label] of screens) {
      const file = path.join(OUT, `${roleLabel}-${label}-${name}.png`);
      let r = await tryShoot(page, url, file);
      if (r.loginRedirect) {
        // mock state likely reset under us — fresh session, one retry
        await ctx.clearCookies();
        cookie = await freshCookie(endpoint, body);
        await ctx.addCookies([cookie]);
        r = await tryShoot(page, url, file);
        console.log(`${r.loginRedirect ? "LOGIN-REDIRECT(retry)" : "OK  (retry)"} ${roleLabel}/${label}@${name} -> ${r.finalUrl}`);
      } else {
        console.log(`${r.error ? "ERR" : "OK "} ${roleLabel}/${label}@${name} -> ${r.finalUrl}${r.error ? " | " + r.error : ""}`);
      }
    }
    await ctx.close();
  }
}

console.log("--- public ---");
await shootPublic();
console.log("--- shopper ---");
await shootAuthed("shop", SHOPPER_SCREENS, "/api/dev/shopper-session");
console.log("--- vendor (v1) ---");
await shootAuthed("vend", VENDOR_SCREENS, "/api/dev/vendor-session", { vendorId: "v1" });
console.log("--- staff ---");
await shootAuthed("staff", STAFF_SCREENS, "/api/dev/admin-session");

await browser.close();
console.log(`\nDone. ${fs.readdirSync(OUT).length} screenshots in ${OUT}`);
