/** rail debug with live fixtures — measures the actual rail element internals */
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "").replace("/neondb?", "/neondb_test?");
const sql = neon(dbUrl);
const stamp = Date.now().toString(36);
const iid = "rbg-i-" + stamp, vid = "rbg-v-" + stamp;
const consent = JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }]);
const IMG = "https://res.cloudinary.com/demo/image/upload/sample.jpg";

try {
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"rbg-" + stamp + "@t.dev"}, 'RBG Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true, ${consent}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'RBG Vendor', ${"rbgv" + stamp}, ${"rbg" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  for (let i = 1; i <= 6; i++) {
    await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_min_minor, is_published, status, images, is_featured, created_at, source)
      VALUES (${`rbg-l-${i}-${stamp}`}, ${vid}, ${"RBG item" + i}, 'd', 'food', 50000, true, 'active', ${JSON.stringify([IMG, IMG])}::jsonb, ${i === 1}, ${i === 2 ? new Date().toISOString() : new Date(Date.now() - 10 * 864e5).toISOString()}, null::text)`;
  }
  for (const w of [390, 1280]) {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto(`http://localhost:3031/explore?next=mb`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="mb-grid"] [data-testid="mb-card"]').length >= 4, { timeout: 30000 });
    await page.waitForTimeout(2500);
    console.log(w, await page.evaluate(`(() => {
      const out = [];
      for (const t of ['mb-trending', 'mb-under5k']) {
        const sec = document.querySelector('[data-testid="' + t + '"]');
        if (!sec) { out.push(t + ': SECTION ABSENT'); continue; }
        const rail = sec.querySelector('.mb-rail');
        if (!rail) { out.push(t + ': NO RAIL — inner: ' + sec.innerHTML.slice(0, 120)); continue; }
        out.push(t + ': kids=' + rail.children.length + ' sw=' + rail.scrollWidth + ' cw=' + rail.clientWidth + ' ox=' + getComputedStyle(rail).overflowX + ' disp=' + getComputedStyle(rail).display + ' kidW=' + (rail.children[0] ? Math.round(rail.children[0].getBoundingClientRect().width) : '-'));
      }
      return JSON.stringify(out);
    })()`));
    await page.close();
    await browser.close();
  }
} finally {
  await sql`DELETE FROM listings WHERE id LIKE ${`rbg-l-%-${stamp}`}`;
  await sql`DELETE FROM sessions WHERE identity_id = ${iid}`;
  await sql`DELETE FROM vendors WHERE id = ${vid}`;
  await sql`DELETE FROM identities WHERE id = ${iid}`;
}
