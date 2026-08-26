/**
 * D0c DOM inspection — hard evidence for visual findings.
 * Run: node scripts/d0c-inspect.mjs  (server on 3001, warm state)
 */
import { chromium, request as pwRequest } from "@playwright/test";

const BASE = process.env.D0C_BASE ?? "http://localhost:3001";

async function freshCookie(endpoint, body) {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(`${BASE}${endpoint}`, { data: body ?? {}, timeout: 30000 });
  const setCookie = res.headers()["set-cookie"];
  await ctx.dispose();
  const m = setCookie?.match(/sessionId=([^;]+)/);
  return m ? { name: "sessionId", value: m[1], domain: "localhost", path: "/" } : null;
}

const browser = await chromium.launch();
const out = [];
const log = (s) => { out.push(s); console.log(s); };

// ---- 1. LOGIN: turnstile widget state ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2500);
  const widgetDiv = await page.$(".cf-turnstile");
  const iframe = await page.$(".cf-turnstile iframe");
  const turnstileScript = await page.$('script[src*="challenges.cloudflare.com"]');
  const submitDisabled = await page.$eval('[data-testid="login-submit"]', (b) => b.disabled).catch(() => null);
  log(`LOGIN@390: widgetDiv=${!!widgetDiv} iframe=${!!iframe} turnstileScriptLoaded=${!!turnstileScript} submitDisabled=${submitDisabled}`);
  const bodyText = await page.textContent("body");
  log(`LOGIN: mentions bot verification: ${/bot verification|verify you are human/i.test(bodyText)}`);
  await ctx.close();
}

// ---- 2. SHOPPER HOME: followed vendors text + messages count + bottom bar overlap ----
{
  const cookie = await freshCookie("/api/dev/shopper-session");
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addCookies([cookie]);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/home`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500);
  const followingSection = await page.$('[data-testid="home-following-vendors"]');
  if (followingSection) {
    const txt = (await followingSection.textContent()).trim().replace(/\s+/g, " ");
    log(`HOME following section text: "${txt.slice(0, 200)}"`);
  } else {
    log("HOME: no home-following-vendors testid found");
  }
  const msgCard = await page.$('[data-testid="quick-action-messages"], [data-testid*="messages"]');
  if (msgCard) log(`HOME messages card text: "${(await msgCard.textContent()).trim().replace(/\s+/g, " ")}"`);
  // bottom tab bar vs content overlap
  const tabBar = await page.$('[data-testid="bottom-tabs"], nav[class*="bottom"], [class*="tabbar"]');
  if (tabBar) {
    const box = await tabBar.boundingBox();
    log(`HOME bottom tab bar box: ${JSON.stringify(box)}`);
  } else {
    // find any fixed-position element near bottom
    const fixed = await page.evaluate(() => {
      const els = [...document.querySelectorAll("*")];
      return els
        .filter((e) => getComputedStyle(e).position === "fixed")
        .map((e) => {
          const r = e.getBoundingClientRect();
          return { tag: e.tagName, cls: (e.className || "").toString().slice(0, 60), top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) };
        })
        .filter((e) => e.height > 20);
    });
    log(`HOME fixed elements: ${JSON.stringify(fixed)}`);
  }
  await ctx.close();
}

// ---- 3. VENDOR DASHBOARD @390: quick-action bar vs bottom tabs overlap ----
{
  const cookie = await freshCookie("/api/dev/vendor-session", { vendorId: "v1" });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addCookies([cookie]);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/vendor/dashboard`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500);
  const fixed = await page.evaluate(() => {
    const els = [...document.querySelectorAll("*")];
    return els
      .filter((e) => getComputedStyle(e).position === "fixed")
      .map((e) => {
        const r = e.getBoundingClientRect();
        return { tag: e.tagName, testid: e.getAttribute("data-testid") || "", cls: (e.className || "").toString().slice(0, 50), top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), zIndex: getComputedStyle(e).zIndex };
      })
      .filter((e) => e.height > 20);
  });
  log(`VENDOR-DASH@390 fixed elements: ${JSON.stringify(fixed, null, 1)}`);
  // detect overlap between two fixed bottom elements
  const bottoms = fixed.filter((f) => f.bottom > 700);
  if (bottoms.length >= 2) {
    const [a, b] = bottoms;
    const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    log(`VENDOR-DASH@390: ${bottoms.length} fixed bottom elements, vertical overlap=${Math.round(overlap)}px`);
  }
  // content hidden behind bars: last visible element bottom vs viewport
  const lastContent = await page.evaluate(() => {
    const main = document.querySelector("main, [data-testid='vendor-dashboard']");
    if (!main) return null;
    const r = main.getBoundingClientRect();
    return { scrollHeight: document.body.scrollHeight, viewport: window.innerHeight, paddingBottom: getComputedStyle(main).paddingBottom };
  });
  log(`VENDOR-DASH@390 content metrics: ${JSON.stringify(lastContent)}`);
  await ctx.close();
}

// ---- 4. /saved: what renders ----
{
  const cookie = await freshCookie("/api/dev/shopper-session");
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addCookies([cookie]);
  const page = await ctx.newPage();
  const resp = await page.goto(`${BASE}/saved`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1000);
  const title = await page.title();
  const h = await page.textContent("h1, h2").catch(() => null);
  log(`SAVED: status=${resp?.status()} finalUrl=${page.url()} title="${title}" heading="${(h || "").trim().slice(0, 80)}"`);
  await ctx.close();
}

// ---- 5. SETTINGS: sections + endpoint buttons ----
{
  const cookie = await freshCookie("/api/dev/shopper-session");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([cookie]);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1000);
  const buttons = await page.$$eval("button", (bs) => bs.map((b) => b.textContent.trim()).filter(Boolean));
  log(`SETTINGS@1440 buttons: ${JSON.stringify(buttons)}`);
  const sessionsList = await page.$('[data-testid*="session"]');
  log(`SETTINGS: sessions section present=${!!sessionsList}`);
  await ctx.close();
}

// ---- 6. STAFF: hardcoded blues ----
{
  const cookie = await freshCookie("/api/dev/admin-session");
  if (!cookie) {
    log("STAFF: admin-session FAILED (no cookie)");
  } else {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([cookie]);
    const page = await ctx.newPage();
    for (const [url, label] of [["/staff", "staff"], ["/staff/analytics", "staff-analytics"], ["/staff/config", "staff-config"]]) {
      await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(800);
      const blues = await page.evaluate(() => {
        const els = [...document.querySelectorAll("*")];
        const hits = new Set();
        for (const e of els) {
          const cs = getComputedStyle(e);
          for (const prop of ["color", "backgroundColor", "borderColor"]) {
            const v = cs[prop];
            if (/rgb\(25, 118, 210\)|rgb\(21, 101, 192\)|rgb\(13, 71, 161\)/.test(v)) hits.add(`${prop}:${v}`);
          }
        }
        return [...hits];
      });
      log(`${label}@1440 off-brand blues: ${blues.length ? JSON.stringify(blues) : "none"}`);
    }
    await ctx.close();
  }
}

// ---- 7. VENDOR WIZARD: one-line desc field present ----
{
  const cookie = await freshCookie("/api/dev/shopper-session"); // shopper identity, no vendorId -> wizard step 1
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addCookies([cookie]);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/onboarding/vendor`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1000);
  const labels = await page.$$eval("label, h1, h2", (els) => els.map((e) => e.textContent.trim()).filter(Boolean).slice(0, 12));
  log(`WIZARD@390 labels: ${JSON.stringify(labels)}`);
  await ctx.close();
}

await browser.close();
console.log("\n--- DONE ---");
