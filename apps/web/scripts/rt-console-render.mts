/** Follow-up: identify the specific small/off-screen buttons on /staff/config @390px. */
import { chromium } from "playwright";
import { readFileSync } from "fs";
import { neon } from "@neondatabase/serverless";

const BASE = "http://localhost:3031";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const TEST_URL = env.match(/DATABASE_URL=([^\n\r]+)/)[1].replace("/neondb?", "/neondb_test?");
const sql = neon(TEST_URL);
const stamp = Date.now();
const adminId = "id-p2b-" + stamp;
const nowIso = new Date().toISOString();
await sql`INSERT INTO identities (id, email, name, role, staff_role, account_status, email_verified, consent, created_at, updated_at)
  VALUES (${adminId}, ${"rt-p2b-" + stamp + "@voeq-test.ng"}, ${"P2b Admin"}, ${"shopper"}, ${"super_admin"}, ${"active"}, ${true}, ${"[]"}, ${nowIso}, ${nowIso})`;
const sessId = "sess-p2b-" + stamp;
await sql`INSERT INTO sessions (id, identity_id, created_at, expires_at) VALUES (${sessId}, ${adminId}, ${nowIso}, ${new Date(Date.now() + 3600_000).toISOString()})`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addCookies([{ name: "sessionId", value: sessId, url: BASE }]);
const page = await ctx.newPage();
await page.goto(`${BASE}/staff/config`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

const data = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("button").forEach((b) => {
    const r = b.getBoundingClientRect();
    if (r.height === 0 && r.width === 0) return;
    const inScrollStrip = !!b.closest('[style*="overflow-x"]') || !!b.closest(".config-section-nav");
    out.push({
      text: (b.textContent || "").trim().slice(0, 30),
      cls: b.className?.toString().slice(0, 40),
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      inScrollStrip,
    });
  });
  return out;
});

for (const b of data) {
  const small = b.h < 38;
  const off = b.x + b.w > 391 || b.x < -1;
  if (small || off) {
    console.log(`ISSUE: "${b.text}" cls=${b.cls} @ x=${b.x} y=${b.y} w=${b.w} h=${b.h} scrollStrip=${b.inScrollStrip}`);
  }
}
console.log(`checked ${data.length} buttons`);

await sql`DELETE FROM sessions WHERE id = ${sessId}`;
await sql`DELETE FROM identities WHERE id = ${adminId}`;
await browser.close();
