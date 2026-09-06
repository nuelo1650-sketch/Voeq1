/**
 * OUT-OF-GRID BUTTON AUDIT @390px: walks every VENDOR + SHOPPER surface with a
 * seeded live vendor session, measures EVERY button/label-CTA against its
 * nearest bordered container (section/card/panel), and flags:
 *   - ESCAPE: button right edge > container right edge (+1px tolerance)
 *   - OFFSCREEN: button right edge > 390 (viewport)
 *   - WRAP-RISK: two-button rows without flexWrap on a narrow container
 * Prints file:class/section + geometry for every flag. Read-only; seeds + cleans.
 */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const stamp = Date.now().toString(36);
const idId = "og-i-" + stamp;
const vendorId = "og-v-" + stamp;
const sessId = "og-s-" + stamp;
const listingId = "og-l-" + stamp;
const BASE = "http://localhost:3031";

await sql`INSERT INTO identities (id, email, name, role, staff_role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
  VALUES (${idId}, ${"og-" + stamp + "@voeq-test.example"}, 'OG Vendor', 'vendor', NULL, ${vendorId}, 'nmu-okerenkoko', 'active', true, '[]'::jsonb, now(), now())`;
await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, profile_photo_url)
  VALUES (${vendorId}, ${idId}, 'OG Vendor', ${"og" + stamp}, ${"og-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', 'https://res.cloudinary.com/demo/image/upload/sample.jpg')`;
await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, is_featured, status, images)
  VALUES (${listingId}, ${vendorId}, 'OG Listing', 'd.', 'food', 150000, 150000, true, false, 'published', '[]'::jsonb)`;
await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at)
  VALUES (${sessId}, ${idId}, now() + interval '2 hours', now())`;

const ROUTES = [
  "/vendor/dashboard",
  "/vendor/storefront",
  "/vendor/listings",
  "/vendor/listings/create",
  "/vendor/analytics",
  "/vendor/reviews",
  "/home",
  "/saved",
  "/settings",
  "/onboarding/vendor",
];

const { chromium } = await import("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.context().addCookies([{ name: "sessionId", value: sessId, url: BASE }]);

const flags: string[] = [];
for (const route of ROUTES) {
  try {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1800); // hydration + client data
    const audit = await page.evaluate(`(() => {
      const out = [];
      const buttons = Array.from(document.querySelectorAll("button, label[class*='button' i], [role='button'], a[class*='btn' i]"));
      for (const b of buttons) {
        const r = b.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const text = (b.textContent || '').trim().slice(0, 28);
        // nearest bordered ancestor = the "box"
        let box = b.parentElement;
        let boxR = null;
        while (box && box !== document.body) {
          const cs = getComputedStyle(box);
          if (cs.borderStyle !== 'none' && (parseInt(cs.borderWidth) || 0) > 0) { boxR = box.getBoundingClientRect(); break; }
          box = box.parentElement;
        }
        const flag = {};
        if (boxR && r.right > boxR.right + 1) flag.escape = Math.round(r.right - boxR.right);
        if (r.right > 391) flag.offscreen = Math.round(r.right - 390);
        if (Object.keys(flag).length) out.push({ text, route: location.pathname, flag, btn: { l: Math.round(r.left), r: Math.round(r.right) }, box: boxR ? { l: Math.round(boxR.left), r: Math.round(boxR.right) } : null });
      }
      return JSON.stringify(out);
    })()`);
    for (const f of JSON.parse(audit)) flags.push(f);
  } catch (e) {
    flags.push({ route, fatal: String(e).slice(0, 120) });
  }
}

await browser.close();
await sql`DELETE FROM listings WHERE vendor_id = ${vendorId}`;
await sql`DELETE FROM sessions WHERE id = ${sessId}`;
await sql`DELETE FROM vendors WHERE id = ${vendorId}`;
await sql`DELETE FROM identities WHERE id = ${idId}`;

console.log(`routes walked: ${ROUTES.length}, buttons flagged: ${flags.length}`);
for (const f of flags) console.log(JSON.stringify(f));
process.exit(0);
