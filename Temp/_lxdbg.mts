import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "").replace("/neondb?", "/neondb_test?");
const sql = neon(dbUrl);
const stamp = Date.now().toString(36);
const iid = "lx-i-" + stamp, vid = "lx-v-" + stamp;
const consent = JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }]);
const IMG = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
try {
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"lx-" + stamp + "@t.dev"}, 'LX Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true, ${consent}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'LX Vendor', ${"lxv" + stamp}, ${"lx" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  for (let i = 1; i <= 6; i++) {
    await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_min_minor, is_published, status, images, is_featured, created_at, source)
      VALUES (${`lx-l-${i}-${stamp}`}, ${vid}, ${"LX item" + i}, 'd', 'food', 50000, true, 'active', ${JSON.stringify([IMG, IMG])}::jsonb, ${i === 1}, ${new Date(Date.now() - 10 * 864e5).toISOString()}, null::text)`;
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://localhost:3031/explore/live?next=mb", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !!document.querySelector('[data-testid="mb-live-pick"]'), { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
  console.log(await page.evaluate(`(() => {
    const xc = document.querySelectorAll('[data-testid="mb-xcard"]');
    const rail = xc[0]?.closest('.mb-rail');
    const rails = [...document.querySelectorAll('.mb-rail')];
    return JSON.stringify({
      xc: xc.length,
      railFound: !!rail,
      railKids: rail ? rail.children.length : 0,
      sw: rail ? rail.scrollWidth : 0, cw: rail ? rail.clientWidth : 0,
      kidW: rail && rail.children[0] ? Math.round(rail.children[0].getBoundingClientRect().width) : 0,
      railsOnPage: rails.length,
      xrailSection: !!document.querySelector('[data-testid="mb-live-xrail"]'),
    });
  })()`));
  await browser.close();
} finally {
  await sql`DELETE FROM listings WHERE id LIKE ${`lx-l-%-${stamp}`}`;
  await sql`DELETE FROM sessions WHERE identity_id = ${iid}`;
  await sql`DELETE FROM vendors WHERE id = ${vid}`;
  await sql`DELETE FROM identities WHERE id = ${iid}`;
}
