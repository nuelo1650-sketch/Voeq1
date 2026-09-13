/** Verify BOTH niche fixes: storefront pill (mapper) + explore card badge.
 *  Seeds a live vendor with an 'other'-category listing carrying a niche. */
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "").replace("/neondb?", "/neondb_test?");
const sql = neon(dbUrl);
const stamp = "nz" + Date.now().toString(36);
const iid = `nz-i-${stamp}`, vid = `nz-v-${stamp}`, lid = `nz-l-${stamp}`;
const consent = JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }]);
let fails = 0;
const check = (n: string, ok: boolean, d = "") => { console.log(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`); if (!ok) fails++; };
try {
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${`nz-${stamp}@t.dev`}, 'NZ Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true, ${consent}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'NZ Vendor', ${`nz${stamp}`}, ${`nz-${stamp}`}, 'nmu-okerenkoko', '["other"]'::jsonb, 'live', true, 'd', now())`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_min_minor, price_minor, is_published, status, images, is_featured, created_at, source, short_description)
    VALUES (${lid}, ${vid}, 'NZ Laptop Repairs', 'd', 'other', 350000, 350000, true, 'active', ${JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg"])}::jsonb, false, now(), null::text, ${"Niche: Laptop repairs & tech rescue"})`;

  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  // storefront pill
  await p.goto(`http://localhost:3031/vendor/${vid}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.waitForSelector(".vs-cat-badge", { timeout: 30000 });
  await p.waitForTimeout(1000);
  const pills = await p.$$eval(".vs-cat-badge", (els) => els.map((e) => (e.textContent ?? "").trim()));
  check("S1 storefront pill shows NICHE not 'Other'", pills.includes("Laptop repairs & tech rescue") && !pills.includes("Other"), JSON.stringify(pills));
  // explore card badge (all-nigeria shows it)
  // ?next=old = the classic explore (ListingCard path = the one shipping on
  // prod today). MB floor defaults here in dev; its MbCard got the same fix.
  await p.goto("http://localhost:3031/explore?next=old&category=other", { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.waitForFunction(() => document.querySelectorAll('[data-testid="listing-card"]').length > 0, { timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const cardText = await p.evaluate(`(() => {
    const cards = [...document.querySelectorAll('[data-testid="listing-card"]')];
    const mine = cards.find(c => (c.textContent||'').includes('NZ Laptop Repairs'));
    return mine ? (mine.textContent||'').slice(0, 120) : 'NOT FOUND among ' + cards.length;
  })()`);
  check("E1 explore card shows niche", cardText.includes("Laptop repairs"), cardText.slice(0, 80));
  check("E2 explore card does NOT say 'Other'", !/\bOther\b/.test(cardText), "");
  await b.close();
} finally {
  await sql`DELETE FROM listings WHERE id = ${lid}`;
  await sql`DELETE FROM sessions WHERE identity_id = ${iid}`;
  await sql`DELETE FROM vendors WHERE id = ${vid}`;
  await sql`DELETE FROM identities WHERE id = ${iid}`;
}
console.log(fails === 0 ? "ALL PASS" : `FAILED: ${fails}`);
process.exit(fails === 0 ? 0 : 1);
