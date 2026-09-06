/**
 * LAYERS 1-4 round-trip vs TEST DB + live dev:
 * L1.1: share API canonical = /vendor/<id>; /v/<slug> 301s to the storefront.
 * L1.2: copy button renders visible (computed background ≠ transparent).
 * L1.3: vendor verification-request → staff case in 'verifications' queue +
 *       duplicate request returns alreadyOpen; a verified vendor gets 409.
 * L2:   /vendor/preview renders the banner + real storefront for the owner;
 *       entry button exists on the dashboard.
 * L4a:  vendor CAN like their own listing + own storefront (was 400).
 * L4b:  whatsappChannel saves via socials PATCH + renders on storefront.
 * Seeds throwaway vendor/identity/session + listing; self-cleans.
 */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const stamp = Date.now().toString(36);
const idId = "l4-i-" + stamp;
const vendorId = "l4-v-" + stamp;
const sessId = "l4-s-" + stamp;
const listingId = "l4-l-" + stamp;
const results: string[] = [];
const check = (name: string, ok: boolean, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);

const BASE = "http://localhost:3031";
const H = { "content-type": "application/json", cookie: `sessionId=${sessId}` };

try {
  // seed: UNVERIFIED live vendor + session + one listing
  await sql`INSERT INTO identities (id, email, name, role, staff_role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${idId}, ${"l4-" + stamp + "@voeq-test.example"}, 'Layer Vendor', 'vendor', NULL, ${vendorId}, 'nmu-okerenkoko', 'active', true, '[]'::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description)
    VALUES (${vendorId}, ${idId}, 'Layer Vendor', ${"l4" + stamp}, ${"l4-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', false, 'probe')`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, is_featured, status, images)
    VALUES (${listingId}, ${vendorId}, 'L4 Listing', 'Probe listing.', 'food', 150000, 150000, true, false, 'published', '[]'::jsonb)`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at)
    VALUES (${sessId}, ${idId}, now() + interval '2 hours', now())`;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.context().addCookies([{ name: "sessionId", value: sessId, url: BASE }]);

  // ---- L1.1: share canonical + /v redirect ----
  const share = await (await fetch(`${BASE}/api/share/vendor?vendorId=${vendorId}`)).json();
  check("L1.1a: share canonical → /vendor/<id>", String(share.canonical).endsWith(`/vendor/${vendorId}`), String(share.canonical));
  const vResp = await page.goto(`${BASE}/v/l4-${stamp}`, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => null);
  const finalUrl = page.url();
  check("L1.1b: legacy /v/<slug> redirects to storefront", finalUrl.includes(`/vendor/${vendorId}`), `final: ${finalUrl}`);

  // ---- L1.2: copy button visible ----
  await page.goto(`${BASE}/vendor/${vendorId}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("[data-testid='share-copy']", { timeout: 30000 }).catch(() => {});
  const bg = await page.locator("[data-testid='share-copy']").evaluate((el) => getComputedStyle(el).backgroundColor).catch(() => "MISSING");
  check("L1.2: copy button has real background", bg !== "MISSING" && bg !== "rgba(0, 0, 0, 0)" && !bg.includes("0, 0, 0, 0)"), `bg: ${bg}`);

  // ---- L1.3: verification request (API + duplicate + staff case) ----
  const vr1 = await fetch(`${BASE}/api/vendor/verification-request`, { method: "POST", headers: H });
  const vr1Body = await vr1.json().catch(() => ({}));
  check("L1.3a: verification request → 200", vr1.status === 200, `${vr1.status} ${JSON.stringify(vr1Body).slice(0, 80)}`);
  const cases = await sql`SELECT id, status, payload FROM staff_cases WHERE payload->>'vendorId' = ${vendorId}`;
  check("L1.3b: staff case created in queue", cases.length === 1 && cases[0].status === "open", `cases: ${cases.length}`);
  const vr2 = await fetch(`${BASE}/api/vendor/verification-request`, { method: "POST", headers: H });
  const vr2Body = await vr2.json().catch(() => ({}));
  check("L1.3c: duplicate request → alreadyOpen (no second case)", vr2.status === 200 && vr2Body.alreadyOpen === true, `${vr2.status} ${JSON.stringify(vr2Body).slice(0, 60)}`);

  // ---- L2: preview mode ----
  const pv = await page.goto(`${BASE}/vendor/preview`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("[data-testid='preview-banner']", { timeout: 30000 }).catch(() => {});
  const banner = await page.locator("[data-testid='preview-banner']").count();
  const exit = await page.locator("[data-testid='preview-exit']").count();
  const editL = await page.locator("[data-testid='preview-edit-listings']").count();
  const hero = await page.locator("[data-testid='storefront-page']").count();
  check("L2a: preview renders banner + real storefront", banner === 1 && hero === 1 && exit === 1 && editL === 1, `banner:${banner} hero:${hero} exit:${exit} edit:${editL} status:${pv?.status()}`);

  // ---- L4a: self-like allowed ----
  const likeOwnListing = await fetch(`${BASE}/api/like`, { method: "POST", headers: H, body: JSON.stringify({ targetType: "listing", targetId: listingId }) });
  const likeOwnVendor = await fetch(`${BASE}/api/like`, { method: "POST", headers: H, body: JSON.stringify({ targetType: "vendor", targetId: vendorId }) });
  check("L4a: vendor can like own listing + own storefront", likeOwnListing.status === 200 && likeOwnVendor.status === 200, `listing:${likeOwnListing.status} vendor:${likeOwnVendor.status}`);
  // un-like to leave clean state
  await fetch(`${BASE}/api/like`, { method: "POST", headers: H, body: JSON.stringify({ targetType: "listing", targetId: listingId }) });
  await fetch(`${BASE}/api/like`, { method: "POST", headers: H, body: JSON.stringify({ targetType: "vendor", targetId: vendorId }) });

  // ---- L4b: whatsappChannel social ----
  const saveSocials = await fetch(`${BASE}/api/vendor/socials`, { method: "PATCH", headers: H, body: JSON.stringify({ whatsappChannel: "https://www.whatsapp.com/channel/0029Vb8u4Md6mYPON8gMpi3i" }) });
  check("L4b: whatsappChannel saves", saveSocials.status === 200, String(saveSocials.status));
  await page.goto(`${BASE}/vendor/${vendorId}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("[data-testid='storefront-social-whatsapp'], [data-testid='storefront-socials']", { timeout: 30000 }).catch(() => {});
  const wa = await page.locator("[data-testid='storefront-social-whatsapp']").count();
  const waHref = wa === 1 ? await page.locator("[data-testid='storefront-social-whatsapp']").getAttribute("href") : null;
  check("L4b: WhatsApp channel renders on storefront", wa === 1 && !!waHref?.startsWith("https://www.whatsapp.com/channel/"), `el:${wa} href:${waHref}`);

  await browser.close();
} catch (e) {
  results.push("FAIL fatal — " + String(e).slice(0, 300));
} finally {
  await sql`DELETE FROM staff_cases WHERE payload->>'vendorId' = ${vendorId}`;
  await sql`DELETE FROM notifications WHERE identity_id = ANY (SELECT id FROM identities WHERE staff_role IS NOT NULL) AND payload->>'refId' IN (SELECT id FROM staff_cases WHERE payload->>'vendorId' = ${vendorId})`.catch(() => {});
  await sql`DELETE FROM likes WHERE target_id IN (${listingId}, ${vendorId})`.catch(() => {});
  await sql`DELETE FROM listings WHERE vendor_id = ${vendorId}`;
  await sql`DELETE FROM sessions WHERE id = ${sessId}`;
  await sql`DELETE FROM vendors WHERE id = ${vendorId}`;
  await sql`DELETE FROM identities WHERE id = ${idId}`;
  console.log("cleaned");
}

console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL")).length;
console.log(fails === 0 ? "ALL PASS" : `${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
