import { chromium } from "playwright";

const BASE = process.env.D0C_BASE ?? "http://localhost:3002";

async function getCookie(endpoint) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(`${BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (r.ok) {
      const txt = await r.text();
      const m = txt.match(/"sessionId"\s*:\s*"([^"]+)"/);
      if (m) return m[1];
    }
    await new Promise((res) => setTimeout(res, 800));
  }
  throw new Error("no cookie after retries");
}

const browser = await chromium.launch();
const ctx = await browser.newContext();
const cookie = await getCookie("/api/dev/vendor-session");
await ctx.addCookies([{ name: "sessionId", value: cookie, domain: "localhost", path: "/" }]);

// Desktop: sidebar should be visible
const page = await ctx.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/vendor/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForSelector(".app-shell-sidebar", { timeout: 15000 });
await page.waitForTimeout(800);
const sideDesktop = await page.evaluate(() => {
  const el = document.querySelector(".app-shell-sidebar");
  if (!el) return { exists: false, visible: false };
  const cs = getComputedStyle(el);
  return { exists: true, visible: cs.display !== "none", w: el.offsetWidth };
});
await page.screenshot({ path: "audit-shots/d2-vend-dashboard-1440.png", fullPage: false });

// Mobile: bottom-tab should be visible, sidebar hidden
const m = await ctx.newPage();
await m.setViewportSize({ width: 390, height: 844 });
await m.goto(`${BASE}/vendor/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
await m.waitForSelector(".app-shell-bottom", { timeout: 15000 });
await m.waitForTimeout(800);
const sideMobile = await m.evaluate(() => {
  const el = document.querySelector(".app-shell-sidebar");
  const bt = document.querySelector(".app-shell-bottom");
  const cs = el ? getComputedStyle(el) : null;
  const bcs = bt ? getComputedStyle(bt) : null;
  return {
    sidebarDisplay: cs ? cs.display : "missing",
    bottomDisplay: bcs ? bcs.display : "missing",
  };
});
await m.screenshot({ path: "audit-shots/d2-vend-dashboard-390.png", fullPage: false });

console.log("DESKTOP sidebar:", JSON.stringify(sideDesktop));
console.log("MOBILE:", JSON.stringify(sideMobile));
await browser.close();
