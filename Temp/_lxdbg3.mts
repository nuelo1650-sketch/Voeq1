import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "").replace("/neondb?", "/neondb_test?");
const sql = neon(dbUrl);
const stamp = Date.now().toString(36);
const iid = "lxd-i-" + stamp, vid = "lxd-v-" + stamp;
const consent = JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }]);
const IMG = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
try {
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"lxd-" + stamp + "@t.dev"}, 'LXD Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true, ${consent}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'LXD Vendor', ${"lxdv" + stamp}, ${"lxd" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  for (let i = 1; i <= 8; i++) {
    await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_min_minor, is_published, status, images, is_featured, created_at, source)
      VALUES (${`lxd-l-${i}-${stamp}`}, ${vid}, ${"LXD item" + i}, 'd', 'food', 50000, true, 'active', ${JSON.stringify([IMG, IMG])}::jsonb, ${i === 1}, ${new Date(Date.now() - (i === 1 ? 99 : i) * 864e5).toISOString()}, null::text)`;
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const apiCalls: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/api/explore")) apiCalls.push(r.url().replace("http://localhost:3031", "")); });
  await page.goto("http://localhost:3031/explore/live?next=mb", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="mb-live-pick"]').length > 0, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
  console.log("API calls:", JSON.stringify(apiCalls));
  console.log("state:", await page.evaluate(`(() => {
    const s = document.querySelector('[data-testid="mb-live-xrail"]');
    const r = s?.querySelector('.mb-rail');
    return JSON.stringify({
      xrailSection: !!s, rail: !!r, kids: r?.children.length ?? 0,
      sw: r?.scrollWidth ?? 0, cw: r?.clientWidth ?? 0,
      pickCount: document.querySelectorAll('[data-testid="mb-live-pick"]').length,
      tabs: [...document.querySelectorAll('[data-testid^="mb-xtab"]')].map(b => b.getAttribute('data-testid')).join(','),
    });
  })()`));
  await page.click('[data-testid="mb-xtab-fresh"]').catch((e) => console.log("click fail:", e.message.slice(0, 50)));
  await page.waitForTimeout(1500);
  console.log("after fresh:", await page.evaluate(`(() => {
    const r = document.querySelector('[data-testid="mb-live-xrail"] .mb-rail');
    return JSON.stringify({ rail: !!r, kids: r?.children.length ?? 0, sw: r?.scrollWidth ?? 0, cw: r?.clientWidth ?? 0 });
  })()`));
  await browser.close();
} finally {
  await sql`DELETE FROM listings WHERE id LIKE ${`lxd-l-%-${stamp}`}`;
  await sql`DELETE FROM sessions WHERE identity_id = ${iid}`;
  await sql`DELETE FROM vendors WHERE id = ${vid}`;
  await sql`DELETE FROM identities WHERE id = ${iid}`;
}
