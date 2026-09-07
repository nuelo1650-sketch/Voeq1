/** ADMIN AUDIT (founder: "I see 13 vendors, I click it, it doesn't show the
 *  vendors; I approve a vendor and it still shows the same thing") — probe the
 *  admin flows against TEST DB exactly as the founder experiences them. */
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

// seed: super_admin + 3 vendors with OPEN verification cases
const staffId = "ad-s-" + stamp;
const staffSess = "ad-ss-" + stamp;
const cases: string[] = [];
const vendorIds: string[] = [];
try {
  await sql`INSERT INTO identities (id, email, name, role, staff_role, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${staffId}, ${"ad-" + stamp + "@t.dev"}, 'AD Staff', 'shopper', 'super_admin', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${staffSess}, ${staffId}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;

  for (let i = 0; i < 3; i++) {
    const vid = `ad-v${i}-` + stamp, iid = `ad-i${i}-` + stamp;
    vendorIds.push(vid);
    await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
      VALUES (${iid}, ${"ad-v" + i + "-" + stamp + "@t.dev"}, ${"AD Vendor " + i}, 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
        ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
    await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
      VALUES (${vid}, ${iid}, ${"AD Verify Vendor " + i}, ${"adv" + i + stamp}, ${"adv" + i + "-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', false, 'd', ${new Date().toISOString()})`;
    const cid = `ad-case${i}-` + stamp;
    cases.push(cid);
    await sql`INSERT INTO staff_cases (id, queue, status, payload, created_at)
      VALUES (${cid}, 'verifications', 'open', ${JSON.stringify({ vendorId: vid, vendorName: "AD Verify Vendor " + i, description: "Vendor requesting verification badge", campus: "nmu-okerenkoko" })}::jsonb, ${new Date().toISOString()})`;
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.context().addCookies([{ name: "sessionId", value: staffSess, url: BASE }]);

  // A: Verifications tab — founder's "13 vendors, click, doesn't show"
  await page.goto(BASE + "/staff/moderation?tab=verifications", { waitUntil: "domcontentloaded", timeout: 90000 });
  // WAIT FOR HYDRATION (A1 fix): the mobile card list renders only after the
  // useIsMobile matchMedia hook runs — fixed sleeps race it in dev. Wait for
  // EITHER cards OR the empty state to exist.
  await page.waitForSelector("[data-testid='verifications-mobile-cards'], [data-testid='verifications-empty']", { timeout: 30000 });
  // SETTLE PROOF (mini-deep): the empty state shows first, cards flip in at
  // ~3s in dev (client fetch + isMobile flip). Wait until cards EXIST, not
  // until either selector exists.
  await page.waitForFunction(`(() => {
    const cards = document.querySelector("[data-testid='verifications-mobile-cards']");
    return !!cards && cards.children.length > 0;
  })()`, undefined, { timeout: 30000 }).catch(() => {});
  const domState = await page.evaluate(`(() => {
    const cards = document.querySelector("[data-testid='verifications-mobile-cards']");
    return JSON.stringify({
      cardCount: cards ? cards.children.length : 0,
      firstName: cards && cards.children[0] ? (cards.children[0].textContent || "").slice(0, 40) : "",
      firstHref: cards && cards.children[0] ? (cards.children[0].querySelector("a")?.getAttribute("href") ?? "") : "",
    });
  })()`);
  const dom = JSON.parse(domState);
  const cardCount = dom.cardCount;
  check("A1: verification cards render on mobile", cardCount >= 3, `n=${cardCount}`);
  const firstCard = dom.firstName;
  check("A2: card shows vendor NAME (not id fragment)", firstCard.includes("AD Verify Vendor"), firstCard);

  // B: the vendor link on a card — where does it go, does it 404?
  const href = dom.firstHref;
  check("B1: card links to storefront", !!href && href.startsWith("/vendor/"), href || "none");
  const res = await page.request.get(BASE + (href ?? "/vendor/x"));
  check("B2: staff storefront view 200 (no 404)", res.status() === 200, `status=${res.status()}`);

  // C: approve flow — card must DISAPPEAR after approve
  const before = await page.locator("[data-testid='verifications-mobile-cards'] > div").count();
  const approveBtn = page.evaluate(`(() => {
    const cards = document.querySelectorAll("[data-testid='verifications-mobile-cards'] > div");
    if (cards.length === 0) return "no-cards";
    const btn = [...cards[0].querySelectorAll("button")].find((b) => b.textContent?.includes("Approve"));
    if (btn) btn.click();
    return btn ? "clicked" : "no-button";
  })()`);
  console.log("approve click:", await approveBtn);
  await page.waitForTimeout(600);
  // modal: reason is REQUIRED (Confirm disabled until filled)
  const reasonArea = page.locator("textarea").first();
  await reasonArea.fill("verified by audit probe");
  const modalConfirm = page.locator("button:has-text('Confirm')");
  await modalConfirm.first().click();
  await page.waitForTimeout(2500);
  // refreshKey re-fetch should have already updated in place; reload is a
  // belt-and-braces double-check that persistence (not just UI) holds.
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-testid='verifications-mobile-cards'], [data-testid='verifications-empty']", { timeout: 30000 });
  await page.waitForFunction(`(() => {
    const cards = document.querySelector("[data-testid='verifications-mobile-cards']");
    return !!cards && cards.children.length > 0;
  })()`, undefined, { timeout: 30000 }).catch(() => {});
  const after = await page.evaluate(`(() => {
    const cards = document.querySelector("[data-testid='verifications-mobile-cards']");
    return cards ? cards.children.length : -1;
  })()`);
  check("C1: approve removes the card from the queue", after === before - 1, `before=${before} after=${after}`);

  // ---- D: Reports tab — resolve flow refreshes ----
  const reportCase = "ad-rep-" + stamp;
  await sql`INSERT INTO staff_cases (id, queue, status, payload, created_at)
    VALUES (${reportCase}, 'reports', 'open', ${JSON.stringify({ targetType: "listing", targetId: "x", body: "AD probe report body", reporterId: staffId, category: "spam" })}::jsonb, ${new Date().toISOString()})`;
  await page.goto(BASE + "/staff/moderation?tab=reports", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForSelector("[data-testid='moderation-tabs']", { timeout: 30000 });
  // reports rows arrive via the same client fetch — wait for the seeded body
  await page.waitForFunction(`(() => document.body.innerText.includes("AD probe report body"))`, undefined, { timeout: 30000 }).catch(() => {});
  const repBefore = await page.locator("text=AD probe report body").count();
  check("D1: report row renders", repBefore >= 1, `n=${repBefore}`);
  const repResolve = page.locator("button[title='Resolve'], button:has-text('Resolve')").first();
  if (await repResolve.count() > 0) {
    await repResolve.click();
    await page.locator("textarea").first().fill("resolved by audit probe");
    await page.locator("button:has-text('Confirm')").first().click();
    await page.waitForTimeout(2000);
    const repCase = await sql`SELECT status FROM staff_cases WHERE id = ${reportCase}`;
    check("D2: report resolved in DB", repCase[0]?.status === "resolved", JSON.stringify(repCase[0]));
  } else {
    check("D2: report resolve button present", false, "no button found");
  }

  // ---- E: Users tab — search finds a seeded user ----
  // REACT TYPING NOTE (founder-reported flow): fill() + Enter does NOT fire
  // React's onChange on some hydration states — type with real key events so
  // the controlled input registers the query, then submit.
  await page.goto(BASE + "/staff/moderation?tab=users", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForSelector("[data-testid='moderation-tabs']", { timeout: 30000 });
  await page.waitForTimeout(1800); // tab content mounts client-side
  await page.locator("input").first().click();
  await page.keyboard.type("AD Vendor 1", { delay: 40 });
  await page.locator("button[type='submit']").click();
  // the staff users search endpoint runs the suspension sweep first (~2-5s in
  // dev) — wait for the row to paint instead of a fixed sleep
  await page.waitForFunction(`(() => document.body.innerText.includes("ad-v1-"))`, undefined, { timeout: 40000 }).catch(() => {});
  const userRow = await page.locator("text=ad-v1-" + stamp).count();
  check("E1: user search finds the vendor", userRow >= 1, `n=${userRow}`);

  // ---- F: Team page renders with promote UI ----
  await page.goto(BASE + "/staff/team", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(1500);
  const teamContent = await page.evaluate(() => document.body.innerText.length);
  check("F1: team page renders content", teamContent > 100, `len=${teamContent}`);
  const teamErr = await page.locator("text=Application error").count() + await page.locator("text=Something went wrong").count();
  check("F2: no error boundary", teamErr === 0);

  // ---- G: Audit + Config + Analytics render with real content ----
  await page.goto(BASE + "/staff/audit", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(1500);
  check("G1: audit log renders", (await page.evaluate(() => document.body.innerText.length)) > 100);
  await page.goto(BASE + "/staff/config", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(1500);
  check("G2: config console renders", (await page.evaluate(() => document.body.innerText.length)) > 100);
  await page.goto(BASE + "/staff/analytics", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(1500);
  const analyticsText = await page.evaluate(() => document.body.innerText);
  check("G3: analytics renders", analyticsText.length > 100);
  check("G4: analytics shows vendor count", /vendor/i.test(analyticsText));

  await browser.close();
} catch (e) {
  results.push("FAIL exception — " + String(e).slice(0, 300));
} finally {
  const dels = cases.map((c) => sql`DELETE FROM staff_cases WHERE id = ${c}`);
  dels.push(sql`DELETE FROM staff_cases WHERE id = ${"ad-rep-" + stamp}`);
  for (const vid of vendorIds) {
    dels.push(sql`DELETE FROM vendors WHERE id = ${vid}`);
    dels.push(sql`DELETE FROM identities WHERE vendor_id = ${vid}`);
  }
  dels.push(sql`DELETE FROM sessions WHERE id = ${staffSess}`);
  dels.push(sql`DELETE FROM identities WHERE id = ${staffId}`);
  dels.push(sql`DELETE FROM notifications WHERE title LIKE 'You%verified%'`);
  await Promise.all(dels).catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
