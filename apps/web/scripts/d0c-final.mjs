/**
 * D0c final capture — real shopper home (set prefs first) + clean vendor wizard.
 * Run: node scripts/d0c-final.mjs
 */
import { chromium, request as pwRequest } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.D0C_BASE ?? "http://localhost:3001";
const OUT = path.resolve("audit-shots");
fs.mkdirSync(OUT, { recursive: true });

async function freshCookie(endpoint, body) {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(`${BASE}${endpoint}`, { data: body ?? {}, timeout: 30000 });
  const setCookie = res.headers()["set-cookie"];
  await ctx.dispose();
  const m = setCookie?.match(/sessionId=([^;]+)/);
  return m ? { name: "sessionId", value: m[1], domain: "localhost", path: "/" } : null;
}

const browser = await chromium.launch();

// ---- real shopper home: create session, set feed prefs, then shoot /home ----
{
  const cookie = await freshCookie("/api/dev/shopper-session");
  // stamp feedPrefsSetAt so /home doesn't bounce to onboarding
  const api = await pwRequest.newContext();
  await api.post(`${BASE}/api/onboarding/shopper/complete`, {
    data: { interestTags: ["food", "tech"] },
    headers: { Cookie: `sessionId=${cookie.value}` },
    timeout: 30000,
  });
  await api.dispose();

  for (const { name, width, height } of [
    { name: "390", width: 390, height: 844 },
    { name: "768", width: 768, height: 1024 },
    { name: "1440", width: 1440, height: 900 },
  ]) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    await ctx.addCookies([cookie]);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/home`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, `shop-home-real-${name}.png`), fullPage: true });
    console.log(`shop-home-real@${name} -> ${page.url()}`);

    // DOM evidence on the real dashboard
    if (name === "390") {
      const following = await page.$('[data-testid="home-following-vendors"]');
      if (following) {
        const txt = (await following.textContent()).trim().replace(/\s+/g, " ");
        console.log(`  following section: "${txt.slice(0, 160)}"`);
      } else console.log("  following: no testid");
      const fixed = await page.evaluate(() =>
        [...document.querySelectorAll("*")]
          .filter((e) => getComputedStyle(e).position === "fixed")
          .map((e) => {
            const r = e.getBoundingClientRect();
            return { testid: e.getAttribute("data-testid") || e.tagName, top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), z: getComputedStyle(e).zIndex };
          })
          .filter((e) => e.h > 20)
      );
      console.log(`  fixed@390: ${JSON.stringify(fixed)}`);
    }
    await ctx.close();
  }
}

// ---- clean vendor wizard step 1 (fresh shopper session, no vendorId) ----
{
  const cookie = await freshCookie("/api/dev/shopper-session");
  for (const { name, width, height } of [
    { name: "390", width: 390, height: 844 },
    { name: "1440", width: 1440, height: 900 },
  ]) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    await ctx.addCookies([cookie]);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/onboarding/vendor`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, `vend-wizard-clean-${name}.png`), fullPage: true });
    const labels = await page.$$eval("h1,h2,label", (els) => els.map((e) => e.textContent.trim()).filter(Boolean).slice(0, 10)).catch(() => []);
    console.log(`vend-wizard-clean@${name} -> ${page.url()} | labels: ${JSON.stringify(labels)}`);
    await ctx.close();
  }
}

await browser.close();
console.log("DONE");
