/**
 * D0c wizard-only capture — state is warm now; fresh cookie, immediate shoot.
 * Run: node scripts/d0c-wizard.mjs
 */
import { chromium, request as pwRequest } from "@playwright/test";
import path from "node:path";

const BASE = process.env.D0C_BASE ?? "http://localhost:3001";
const OUT = path.resolve("audit-shots");

async function freshCookie(endpoint, body) {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(`${BASE}${endpoint}`, { data: body ?? {}, timeout: 30000 });
  const setCookie = res.headers()["set-cookie"];
  await ctx.dispose();
  const m = setCookie?.match(/sessionId=([^;]+)/);
  return m ? { name: "sessionId", value: m[1], domain: "localhost", path: "/" } : null;
}

const browser = await chromium.launch();
const cookie = await freshCookie("/api/dev/shopper-session");
if (!cookie) { console.log("no cookie"); process.exit(1); }

for (const { name, width, height } of [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
]) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  await ctx.addCookies([cookie]);
  const page = await ctx.newPage();
  const resp = await page.goto(`${BASE}/onboarding/vendor`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);
  const labels = await page.$$eval("h1,h2,label", (els) => els.map((e) => e.textContent.trim()).filter(Boolean).slice(0, 12)).catch(() => []);
  await page.screenshot({ path: path.join(OUT, `vend-wizard-clean-${name}.png`), fullPage: true });
  console.log(`wizard@${name} status=${resp?.status()} url=${page.url()}`);
  console.log(`  labels: ${JSON.stringify(labels)}`);
  await ctx.close();
}
await browser.close();
console.log("DONE");
