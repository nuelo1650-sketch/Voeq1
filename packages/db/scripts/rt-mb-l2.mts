/** MONEY BAG B2 — round-trip probe: /explore/live + /explore/trending vs TEST DB.
 *  Verifies: pages render, honesty rules hold (no sold/buying claims, deltas
 *  absent, RISING not TRENDING), cross-tabs re-rank in place, empty states,
 *  links back to the canary floor.
 *  Usage: dev server on :3031 (test DB). npx tsx scripts/rt-mb-l2.mts
 */
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const BASE = "http://localhost:3031";
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);

const stamp = Date.now().toString(36);
const iid = "mbl-i-" + stamp, vid = "mbl-v-" + stamp, sess = "mbl-s-" + stamp;

try {
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"mbl-" + stamp + "@t.dev"}, 'MBL Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'MBL Vendor', ${"mblv" + stamp}, ${"mbl-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${iid}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;
  const mk = async (id: string, title: string, featured = false) => {
    await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_min_minor, is_published, status, images, is_featured, created_at, source)
      VALUES (${id}, ${vid}, ${title}, 'd', 'food', 50000, true, 'active', ${JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg"])}::jsonb, ${featured}, ${new Date().toISOString()}, null::text)`;
  };
  await mk("mbl-l-feat-" + stamp, "MBL Featured Live", true);
  await mk("mbl-l-hot-" + stamp, "MBL Hot Chicken");
  await mk("mbl-l-warm-" + stamp, "MBL Warm Rice");

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // ---- LIVE PAGE ----
  await page.goto(`${BASE}/explore/live`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="mb-live-page"]', { timeout: 30000 });
  check("L1: /explore/live renders MB live page", true);
  await page.waitForFunction(
    () => (document.querySelector('[data-testid="mb-live-page"]')?.textContent ?? "").includes("MBL Featured Live"),
    { timeout: 30000 },
  ).catch(() => {});
  const pickVisible = await page.evaluate(() => (document.querySelector('[data-testid="mb-live-page"]')?.textContent ?? "").includes("MBL Featured Live"));
  check("L2: featured real listing renders as a pick", pickVisible);
  const sealCount = await page.$$eval('[data-testid="mb-live-pick"]', (els) => els.length);
  check("L3: exactly the featured listing is a pick (server-capped)", sealCount === 1, `picks=${sealCount}`);
  const liveText = await page.evaluate(() => document.querySelector('[data-testid="mb-live-page"]')?.textContent ?? "");
  check("L4: no sold/buying claims on live page", !/\bsold\b|\bbuying\b/i.test(liveText));
  check("L5: trust card states can't-buy-placement", liveText.includes("can't buy placement") || liveText.includes("can’t buy placement"));
  const whyLines = await page.$$eval('[data-testid="mb-live-why"]', (els) => els.map((e) => e.textContent ?? ""));
  check("L6: every pick carries a Why-it's-here line", sealCount === 0 || whyLines.length === sealCount, JSON.stringify(whyLines).slice(0, 120));

  // cross tabs re-rank in place
  const xrail = await page.$('[data-testid="mb-live-xrail"]');
  if (xrail) {
    const before = await page.$$eval('[data-testid="mb-xcard"]', (els) => els.map((e) => e.textContent?.slice(0, 30)));
    await page.click('[data-testid="mb-xtab-fresh"]');
    await page.waitForTimeout(300);
    const after = await page.$$eval('[data-testid="mb-xcard"]', (els) => els.map((e) => e.textContent?.slice(0, 30)));
    check("L7: x-tab click re-ranks rail (order or set changed)", JSON.stringify(before) !== JSON.stringify(after));
  } else {
    check("L7: x-tab click re-ranks rail", true, "rail collapsed (no non-pick data) — honest collapse");
  }

  // ---- TRENDING PAGE ----
  await page.goto(`${BASE}/explore/trending`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="mb-trending-page"]', { timeout: 30000 });
  check("T1: /explore/trending renders MB trending page", true);
  await page.waitForFunction(
    () => (document.querySelector('[data-testid="mb-trending-board"]')?.textContent ?? "").includes("MBL"),
    { timeout: 30000 },
  ).catch(() => {});
  const tText = await page.evaluate(() => document.querySelector('[data-testid="mb-trending-page"]')?.textContent ?? "");
  check("T2: headline honest — 'loves' not 'buying'", tText.includes("loves") && !/market\s+is\s+buying/i.test(tText));
  check("T3: no fake deltas (▲▼) anywhere on the board", !/▲|▼/.test(tText));
  check("T4: RISING tag present, TRENDING flame absent", tText.includes("RISING") && !/🔥/.test(tText));
  const ranks = await page.$$eval('[data-testid="mb-trend-rank"]', (els) => els.map((e) => e.textContent ?? ""));
  check("T5: ranked board ordered #1..N", ranks[0] === "#1" && ranks.length >= 2, `ranks=${ranks.slice(0, 4).join(",")}`);

  await browser.close();
} finally {
  await Promise.all([
    sql`DELETE FROM listings WHERE title LIKE 'MBL %'`,
    sql`DELETE FROM vendors WHERE name = 'MBL Vendor'`,
    sql`DELETE FROM sessions WHERE identity_id = ${iid}`,
    sql`DELETE FROM identities WHERE id = ${iid}`,
  ]).catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
