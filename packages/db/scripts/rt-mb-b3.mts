/** MONEY BAG B3 — round-trip probe: category + area pages vs TEST DB.
 *  Verifies: /explore/c/[slug] catalog filtering, /explore/areas/[slug] via
 *  vendors.area_id (F1), proximity lines only where true, honest empty states,
 *  areas seed (37 states+FCT), directory navigation.
 *  Usage: dev server on :3031 (test DB). npx tsx scripts/rt-mb-b3.mts
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
const iid = "mbc-i-" + stamp, vid = "mbc-v-" + stamp, sess = "mbc-s-" + stamp;
const iidA = "mbca-i-" + stamp, vidA = "mbca-v-" + stamp, sessA = "mbca-s-" + stamp;

try {
  // campus vendor w/ 2 food listings
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"mbc-" + stamp + "@t.dev"}, 'MBC Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'MBC Vendor', ${"mbcv" + stamp}, ${"mbc-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${iid}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_min_minor, is_published, status, images, is_featured, created_at, source)
    VALUES (${"mbc-l-food-" + stamp}, ${vid}, 'MBC Food One', 'd', 'food', 50000, true, 'active', ${JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg"])}::jsonb, false, ${new Date().toISOString()}, null::text)`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_min_minor, is_published, status, images, is_featured, created_at, source)
    VALUES (${"mbc-l-gad-" + stamp}, ${vid}, 'MBC Gadget One', 'd', 'gadgets', 50000, true, 'active', ${JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg"])}::jsonb, false, ${new Date().toISOString()}, null::text)`;

  // AREA vendor (Okerenkoko) w/ 1 listing — the F1 path
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iidA}, ${"mbca-" + stamp + "@t.dev"}, 'MBC Area Vendor', 'vendor', ${vidA}, '', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, area_id, agreement_accepted_at)
    VALUES (${vidA}, ${iidA}, 'MBC Area Vendor', ${"mbcav" + stamp}, ${"mbca-" + stamp}, '', '["food"]'::jsonb, 'live', true, 'd', 'delta-okerenkoko', ${new Date().toISOString()})`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sessA}, ${iidA}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_min_minor, is_published, status, images, is_featured, created_at, source)
    VALUES (${"mbc-l-area-" + stamp}, ${vidA}, 'MBC Area Fish', 'd', 'food', 50000, true, 'active', ${JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg"])}::jsonb, false, ${new Date().toISOString()}, null::text)`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // ---- CATEGORY PAGE ----
  await page.goto(`${BASE}/explore/c/food-drinks`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="mb-category-page"]', { timeout: 30000 });
  check("C1: /explore/c/food-drinks renders catalog", true);
  await page.waitForFunction(
    () => (document.querySelector('[data-testid="mb-category-page"]')?.textContent ?? "").includes("MBC Food One"),
    { timeout: 30000 },
  ).catch(() => {});
  const catText = await page.evaluate(() => document.querySelector('[data-testid="mb-category-page"]')?.textContent ?? "");
  check("C2: catalog shows the food listing", catText.includes("MBC Food One"));
  check("C3: catalog does NOT leak other categories", !catText.includes("MBC Gadget One"));
  check("C4: honest count line present", /\d+ of \d+ listings?/.test(catText) || catText.includes("1 of"), catText.slice(0, 80));

  // ---- AREA PAGE (F1) ----
  await page.goto(`${BASE}/explore/areas/delta-okerenkoko`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="mb-area-page"]', { timeout: 30000 });
  check("A1: /explore/areas/delta-okerenkoko renders flyer", true);
  await page.waitForFunction(
    () => (document.querySelector('[data-testid="mb-area-page"]')?.textContent ?? "").includes("MBC Area Fish"),
    { timeout: 30000 },
  ).catch(() => {});
  const areaText = await page.evaluate(() => document.querySelector('[data-testid="mb-area-page"]')?.textContent ?? "");
  check("A2: area page shows the area vendor's listing", areaText.includes("MBC Area Fish"));
  check("A3: proximity line renders only where true (Okerenkoko = next to NMU)", areaText.includes("Right next to NMU"));

  // area with NO vendors = honest empty
  await page.goto(`${BASE}/explore/areas/kano-kano`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="mb-area-page"]', { timeout: 30000 });
  await page.waitForFunction(
    () => {
      const t = document.querySelector('[data-testid="mb-area-page"]')?.textContent ?? "";
      return t.includes("No stalls here yet") || t.includes("MBC");
    },
    { timeout: 30000 },
  ).catch(() => {});
  const emptyText = await page.evaluate(() => document.querySelector('[data-testid="mb-area-page"]')?.textContent ?? "");
  check("A4: empty area = honest 'No stalls here yet' state", emptyText.includes("No stalls here yet"));
  check("A5: no proximity line on distant areas", !emptyText.includes("Right next to NMU"));

  // ---- AREAS SEED ----
  const states = await sql`SELECT count(DISTINCT state_name)::int AS n FROM areas`;
  check("S1: areas taxonomy = 37 states+FCT", states[0].n === 37, `got ${states[0].n}`);
  const delta = await sql`SELECT count(*)::int AS n FROM areas WHERE state_name='Delta'`;
  check("S2: Delta has its areas (incl. Okerenkoko/Kurutie/Ugbomro)", delta[0].n >= 4, `delta=${delta[0].n}`);

  // ---- REGRESSION: campus explore + sections still fine ----
  const res = await fetch(`${BASE}/api/explore?campus=nmu-okerenkoko&sections=1`);
  const body = await res.json();
  check("R1: campus sections API unchanged", Boolean(body.sections) && (body.data?.length ?? 0) > 0);
  const resA = await fetch(`${BASE}/api/explore?area=delta-okerenkoko&sections=1`);
  const bodyA = await resA.json();
  check("R2: area sections API returns area vendor listings", (bodyA.data ?? []).some((l: { title: string }) => l.title === "MBC Area Fish"));

  await browser.close();
} finally {
  await Promise.all([
    sql`DELETE FROM listings WHERE title LIKE 'MBC %'`,
    sql`DELETE FROM vendors WHERE name LIKE 'MBC %'`,
    sql`DELETE FROM sessions WHERE identity_id IN (${iid}, ${iidA})`,
    sql`DELETE FROM identities WHERE id IN (${iid}, ${iidA})`,
  ]).catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
