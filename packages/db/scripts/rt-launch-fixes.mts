/** Launch-fix batch round-trip vs TEST DB + live pages @390px:
 *  A: PUBLISH=GO-LIVE — creating a listing as a pending vendor flips it live
 *     (status live, identity role vendor) and the listing hits /api/explore.
 *  B: VERIFY=RESOLVE+NOTIFY — approve resolves the staff_cases row and writes
 *     a notification to the vendor identity.
 *  C: STAFF VIEW — a staff session can open a pending vendor's storefront
 *     (200 + banner), anon still gets 404.
 *  D: VENDOR INTENT — verify-otp redirects vendor-intent users to
 *     /onboarding/vendor (via API response shape, no full signup dance). */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const stamp = Date.now().toString(36);
const idId = "lf-i-" + stamp;
const vendorId = "lf-v-" + stamp;
const sess = "lf-s-" + stamp;
const staffId = "lf-st-" + stamp;
const staffSess = "lf-ss-" + stamp;
const BASE = "http://localhost:3031";
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);

try {
  // pending vendor: agreement accepted, NO listings yet (publish will flip it)
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${idId}, ${"lf-" + stamp + "@voeq-test.example"}, 'LF Vendor', 'shopper', ${vendorId}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vendorId}, ${idId}, 'LF Vendor', ${"lf" + stamp}, ${"lf-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'pending_listings', false, 'd', ${new Date().toISOString()})`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${idId}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;
  // staff identity for the staff-view check
  await sql`INSERT INTO identities (id, email, name, role, staff_role, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${staffId}, ${"lf-st-" + stamp + "@voeq-test.example"}, 'LF Staff', 'shopper', 'super_admin', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${staffSess}, ${staffId}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.context().addCookies([{ name: "sessionId", value: sess, url: BASE }]);

  // ---- A: publish=go-live ----
  const createRes = await page.request.post(BASE + "/api/listings", {
    data: { title: "LF publish-golive cake", categoryId: "food", priceMinMinor: 250000, description: "probe", images: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"] },
  });
  const body = await createRes.json().catch(() => ({}));
  check("A1: listing create succeeds", createRes.status() === 200, `status=${createRes.status()} body=${JSON.stringify(body).slice(0, 120)}`);
  const listingId = (body as { listing?: { id?: string } }).listing?.id ?? "";
  check("A2: response carries autoGolive", (body as { autoGolive?: boolean }).autoGolive === true, JSON.stringify(body).slice(0, 80));
  const vend = await sql`SELECT status FROM vendors WHERE id = ${vendorId}`;
  check("A3: vendor flipped live", vend[0]?.status === "live", vend[0]?.status);
  const ident = await sql`SELECT role FROM identities WHERE id = ${idId}`;
  check("A4: identity role widened", ident[0]?.role === "vendor", ident[0]?.role);
  const exp = await fetch(BASE + "/api/explore?campus=nmu-okerenkoko&limit=40").then((r) => r.json()).catch(() => null);
  const inExplore = Array.isArray(exp?.data) && exp.data.some((x: { id: string }) => x.id === listingId);
  check("A5: listing appears in explore feed", inExplore);

  // ---- B: verify = resolve + notify ----
  // 2026-09-08 UPDATE: publish=go-live now AUTO-CREATES the verification case
  // (commit 890d802), so this probe must test the NEW contract: the auto-
  // created case is what staff see in the queue, and approving the vendor
  // must resolve THAT case (the first open/triaged match for this vendor).
  // No manual seeding anymore — that created a second case and the approve
  // resolved the auto one while the probe asserted on the seeded one.
  const autoCases = await sql`SELECT id, status FROM staff_cases WHERE queue = 'verifications' AND payload->>'vendorId' = ${vendorId} AND status IN ('open','triaged')`;
  check("B0: auto-created verification case exists", autoCases.length === 1, `n=${autoCases.length}`);
  const caseId = autoCases[0]?.id as string;
  await page.context().clearCookies();
  await page.context().addCookies([{ name: "sessionId", value: staffSess, url: BASE }]);
  const verRes = await page.request.post(BASE + "/api/staff/verify-vendor", {
    data: { vendorId, decision: "approve" },
  });
  check("B1: verify API 200", verRes.status() === 200, `status=${verRes.status()}`);
  const caseAfter = await sql`SELECT status, resolution FROM staff_cases WHERE id = ${caseId}`;
  check("B2: verification case resolved", caseAfter[0]?.status === "resolved", JSON.stringify(caseAfter[0]));
  const notif = await sql`SELECT title FROM notifications WHERE recipient_id = ${idId} ORDER BY created_at DESC LIMIT 1`;
  check("B3: vendor notified", (notif[0]?.title ?? "").includes("verified"), JSON.stringify(notif[0]));
  const vend2 = await sql`SELECT verified FROM vendors WHERE id = ${vendorId}`;
  check("B4: vendor.verified true", vend2[0]?.verified === true);

  // ---- C: staff view of a NON-live storefront ----
  // revert Cassy-style: make the vendor pending again, keep listings
  await sql`UPDATE vendors SET status = 'pending_listings' WHERE id = ${vendorId}`;
  await page.goto(`${BASE}/vendor/${vendorId}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1500);
  check("C1: staff sees pending storefront (200)", page.url().includes(`/vendor/${vendorId}`), page.url().slice(0, 70));
  const banner = await page.locator("[data-testid='staff-view-banner']").count();
  check("C2: staff banner renders", banner === 1, `n=${banner}`);
  const anon = await page.context().browser()!.newContext({ viewport: { width: 390, height: 844 } });
  const anonPage = await anon.newPage();
  const anonRes = await anonPage.goto(`${BASE}/vendor/${vendorId}`, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => null);
  const anon404 = !anonRes || anonRes.status() === 404;
  check("C3: anon still gets 404", anon404, `status=${anonRes?.status()}`);
  await anon.close();

  // ---- D: vendor-intent redirect (API-level) ----
  // craft pending token + otp via the real signup API, then verify
  await page.context().clearCookies();
  await page.context().addCookies([{ name: "sessionId", value: sess, url: BASE }]);
  const su = await page.request.post(BASE + "/api/auth/signup", {
    data: { email: `lf-intent-${stamp}@voeq-test.example`, password: "Testpass1!", name: "LF Intent", intent: "vendor", consent: true },
  });
  const suBody = await su.json().catch(() => ({}));
  const pendingToken = (suBody as { pendingToken?: string }).pendingToken ?? "";
  check("D1: vendor-intent signup accepted", su.status() === 200 && pendingToken !== "", `status=${su.status()}`);
  // fetch the OTP from the test DB (otps table — pending_tokens has no code)
  const otpRow = await sql`SELECT code FROM otps WHERE email = ${`lf-intent-${stamp}@voeq-test.example`} AND purpose = 'registration' LIMIT 1`;
  const otp = otpRow[0]?.code ?? "";
  const vo = await page.request.post(BASE + "/api/auth/verify-otp", {
    data: { email: `lf-intent-${stamp}@voeq-test.example`, token: pendingToken, code: otp, purpose: "registration" },
  });
  const voBody = await vo.json().catch(() => ({}));
  check("D2: verify-otp redirects vendor intent to onboarding/vendor", (voBody as { redirect?: string }).redirect === "/onboarding/vendor", JSON.stringify(voBody).slice(0, 100));

  await browser.close();
} catch (e) {
  results.push("FAIL exception — " + String(e).slice(0, 300));
} finally {
  await Promise.all([
    sql`DELETE FROM sessions WHERE id IN (${sess}, ${staffSess})`,
    sql`DELETE FROM notifications WHERE recipient_id = ${idId}`,
    sql`DELETE FROM staff_cases WHERE id LIKE ${"lf-case-" + stamp}`,
    sql`DELETE FROM otps WHERE email LIKE ${"lf-intent-" + stamp + "@%"}`,
    sql`DELETE FROM pending_tokens WHERE email LIKE ${"lf-intent-" + stamp + "@%"}`,
    sql`DELETE FROM identities WHERE email LIKE ${"lf-intent-" + stamp + "@%"}`,
    sql`DELETE FROM vendors WHERE id = ${vendorId}`,
    sql`DELETE FROM identities WHERE id = ${idId}`,
    sql`DELETE FROM identities WHERE id = ${staffId}`,
  ]).catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
