/** Storefront-CTA + Others-nudge probe @390px vs TEST DB:
 *  A: listing detail renders the visible "Go to <vendor>'s storefront" button
 *     and it navigates to the storefront.
 *  B: a vendor with an "other"-category listing (no niche) sees the nudge
 *     banner on the dashboard; a vendor without such listings does not. */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const stamp = Date.now().toString(36);
const BASE = "http://localhost:3031";
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);
const cleanup: Array<{ t: "i" | "v" | "l" | "s"; id: string }> = [];

const mkIdentityVendor = async (tag: string, status: string, withOtherListing: boolean) => {
  const iid = `${tag}-i-${stamp}`, vid = `${tag}-v-${stamp}`;
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${tag + "-" + stamp + "@t.dev"}, ${tag + " Vendor"}, 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, ${tag + " Vendor"}, ${tag + stamp}, ${tag + "-" + stamp}, 'nmu-okerenkoko', '["other"]'::jsonb, ${status}, true, 'd', ${new Date().toISOString()})`;
  let listingId: string | null = null;
  if (withOtherListing) {
    listingId = `${tag}-l-${stamp}`;
    await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, status, images, short_description)
      VALUES (${listingId}, ${vid}, ${tag + " other listing"}, 'd', 'other', 50000, 50000, true, 'active', '[]'::jsonb, NULL)`;
  }
  const sess = `${tag}-s-${stamp}`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${iid}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;
  cleanup.push({ t: "l", id: listingId ?? "" }, { t: "v", id: vid }, { t: "i", id: iid }, { t: "s", id: sess });
  return { iid, vid, listingId, sess };
};

try {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();

  // ---- A: storefront CTA on listing detail ----
  const anon = await mkIdentityVendor("cta", "live", false);
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  // need a listing for the live vendor: create via API as the vendor
  await page.context().addCookies([{ name: "sessionId", value: anon.sess, url: BASE }]);
  const cr = await page.request.post(BASE + "/api/listings", { data: { title: "CTA storefront probe listing", categoryId: "food", priceMinMinor: 200000, description: "probe description here", images: [] } });
  const cb = await cr.json().catch(() => ({}));
  const listingId = (cb as { listing?: { id?: string } }).listing?.id ?? "";
  check("A0: listing created", cr.status() === 200 && listingId !== "", `status=${cr.status()}`);
  await page.goto(`${BASE}/listing/${listingId}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(800);
  const cta = page.locator("[data-testid='listing-detail-storefront-cta']");
  check("A1: storefront CTA renders", (await cta.count()) === 1);
  const ctaBox = await cta.boundingBox();
  check("A2: CTA is visible-sized (h>=44)", !!ctaBox && ctaBox.height >= 44, ctaBox ? `h=${Math.round(ctaBox.height)}` : "none");
  await cta.click();
  await page.waitForURL(new RegExp(`/vendor/${anon.vid}`), { timeout: 25000 }).catch(() => {});
  check("A3: CTA navigates to the storefront", page.url().includes(`/vendor/${anon.vid}`), page.url().slice(0, 70));

  // ---- B: Others nudge ----
  const other = await mkIdentityVendor("oth", "live", true);
  const clean = await mkIdentityVendor("cln", "live", false);
  const p2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await p2.context().addCookies([{ name: "sessionId", value: other.sess, url: BASE }]);
  await p2.goto(BASE + "/vendor/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
  await p2.waitForTimeout(800);
  check("B1: vendor with 'other' listing sees the nudge", (await p2.locator("[data-testid='others-niche-banner']").count()) === 1);
  await p2.context().clearCookies();
  await p2.context().addCookies([{ name: "sessionId", value: clean.sess, url: BASE }]);
  await p2.goto(BASE + "/vendor/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
  await p2.waitForTimeout(800);
  check("B2: vendor without 'other' listings sees no nudge", (await p2.locator("[data-testid='others-niche-banner']").count()) === 0);

  await browser.close();
} catch (e) {
  results.push("FAIL exception — " + String(e).slice(0, 300));
} finally {
  const dels = cleanup.map(({ t, id }) => {
    if (!id) return Promise.resolve();
    if (t === "l") return sql`DELETE FROM listings WHERE id = ${id}`;
    if (t === "v") return sql`DELETE FROM vendors WHERE id = ${id}`;
    if (t === "s") return sql`DELETE FROM sessions WHERE id = ${id}`;
    return sql`DELETE FROM identities WHERE id = ${id}`;
  });
  await Promise.all(dels).catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
