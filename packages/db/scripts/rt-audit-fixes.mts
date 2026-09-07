/** Audit-fix batch round-trip @390px vs TEST DB:
 *  A: storefront grid cards are CLICKABLE (the C1 regression) — tap card →
 *     /listing/<id> navigates. Explore grid still single-linked (no nested a).
 *  B: landing rail renders LISTINGS (listing-card), zero vendor cards.
 *  C: review stars render as 34px Star icons + "Tap to rate" label.
 *  D: vendor socials form has the WhatsApp-channel input. */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const stamp = Date.now().toString(36);
const idId = "af-i-" + stamp;
const vendorId = "af-v-" + stamp;
const listingId = "af-l-" + stamp;
const BASE = "http://localhost:3031";
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);

try {
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${idId}, ${"af-" + stamp + "@voeq-test.example"}, 'AF Vendor', 'vendor', ${vendorId}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description)
    VALUES (${vendorId}, ${idId}, 'AF Vendor', ${"af" + stamp}, ${"af-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd')`;
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_minor, price_min_minor, is_published, is_featured, status, images)
    VALUES (${listingId}, ${vendorId}, 'AF clickable listing', 'd', 'food', 9900, 9900, true, false, 'active',
      ${JSON.stringify(["https://picsum.photos/id/237/600/400.jpg"])}::jsonb)`;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // ---- A: storefront card clickability ----
  await page.goto(`${BASE}/vendor/${vendorId}`, { waitUntil: "networkidle", timeout: 60000 });
  const cardLink = await page.locator(`[data-testid='listing-card-link'][href='/listing/${listingId}']`).count();
  check("A1: storefront card carries its own link", cardLink === 1, `n=${cardLink}`);
  // nested <a> check: no listing-card-link inside another anchor
  const nested = await page.evaluate(`(() => {
    return [...document.querySelectorAll("[data-testid='listing-card-link']")].filter(a => a.closest("a") !== a).length;
  })()`);
  check("A2: no nested anchors", nested === 0, `n=${nested}`);
  await page.locator(`[data-testid='listing-card-link'][href='/listing/${listingId}']`).click();
  // COLD-COMPILE PITFALL (dev): /listing/[id] takes 2-5s to compile on first
  // hit — waitForURL, never a fixed timeout.
  await page.waitForURL(new RegExp(`/listing/${listingId}`), { timeout: 25000 }).catch(() => {});
  check("A3: tapping the card navigates to the listing", page.url().includes(`/listing/${listingId}`), page.url().slice(0, 70));

  // Explore grid: exactly one link per card (wrapper OR card, never both)
  await page.goto(`${BASE}/explore`, { waitUntil: "networkidle", timeout: 60000 });
  const exploreLinks = await page.evaluate(`(() => {
    const cards = [...document.querySelectorAll("[data-testid='listing-card']")];
    let wrapped = 0, self = 0, both = 0;
    for (const c of cards) {
      const inA = !!c.closest("a");
      const hasSelf = !!c.parentElement?.matches("[data-testid='listing-card-link']");
      if (inA && hasSelf) both++;
      else if (inA || hasSelf) { wrapped++; self += hasSelf ? 1 : 0; }
    }
    return JSON.stringify({ total: cards.length, linked: wrapped, both });
  })()`);
  const ex = JSON.parse(exploreLinks);
  check("A4: explore cards all linked, zero double-links", ex.total > 0 && ex.linked === ex.total && ex.both === 0, exploreLinks);

  // ---- B: landing rail = listings ----
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200); // client fetch
  const railCards = await page.locator("[data-testid='landing-trending-rail'] [data-testid='listing-card']").count();
  const railVendorCards = await page.locator("[data-testid='landing-vendor-card']").count();
  check("B1: landing rail renders listing cards", railCards > 0, `n=${railCards}`);
  check("B2: zero vendor profile cards on landing", railVendorCards === 0, `n=${railVendorCards}`);

  // ---- C: review stars v2 (authed — sign in as the vendor identity) ----
  const sess = "af-sess-" + stamp;
  const exp = new Date(Date.now() + 864e5).toISOString();
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${idId}, ${exp}, ${new Date().toISOString()})`.catch(() => {});
  await page.context().addCookies([{ name: "sessionId", value: sess, url: BASE }]);
  await page.goto(`${BASE}/vendor/${vendorId}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.locator("[data-testid='storefront-write-review']").click();
  await page.waitForTimeout(400);
  const starInfo = await page.evaluate(`(() => {
    const form = document.querySelector("[data-testid='review-form']");
    if (!form) return JSON.stringify({ err: "no form" });
    const svgs = [...form.querySelectorAll("button svg")];
    const label = form.querySelector("[data-testid='review-rating-label']")?.textContent ?? "";
    return JSON.stringify({ starCount: svgs.length, w: svgs[0] ? svgs[0].getBoundingClientRect().width : 0, label });
  })()`);
  const st = JSON.parse(starInfo);
  check("C1: five star icons render", st.starCount === 5, starInfo);
  check("C2: stars are 30px+ (visible)", st.w >= 30, `w=${st.w}`);
  check("C3: rating label present", st.label === "Tap to rate", st.label);
  // click 4th star → label updates
  await page.locator("[data-testid='review-form'] button").nth(3).click();
  const label2 = await page.locator("[data-testid='review-rating-label']").textContent();
  check("C4: tapping a star updates the label", label2 === "4 / 5", label2 ?? "");

  // ---- D: socials form has WhatsApp channel ----
  await page.goto(`${BASE}/vendor/storefront`, { waitUntil: "networkidle", timeout: 60000 });
  const waInput = await page.locator("input[placeholder*='whatsapp.com/channel']").count();
  check("D1: socials form has WhatsApp-channel input", waInput === 1, `n=${waInput}`);

  await browser.close();
} catch (e) {
  results.push("FAIL exception — " + String(e).slice(0, 300));
} finally {
  await Promise.all([
    sql`DELETE FROM sessions WHERE id = ${"af-sess-" + stamp}`,
    sql`DELETE FROM listings WHERE id = ${listingId}`,
    sql`DELETE FROM vendors WHERE id = ${vendorId}`,
    sql`DELETE FROM identities WHERE id = ${idId}`,
  ]);
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
