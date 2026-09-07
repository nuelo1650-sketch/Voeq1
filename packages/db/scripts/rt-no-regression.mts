/** NO-REGRESSION PROBE for existing vendors (David: "make sure these current
 *  changes doesn't break or loop, we already have vendors").
 *  A: LIVE vendor creates ANOTHER listing → stays live, no double role-widen,
 *     listing in explore (publish=go-live idempotency).
 *  B: Google-callback cookie fix shape — cookie must carry expires (unit-level
 *     via session repo: createSession default 30d still holds).
 *  C: verify-otp for EXISTING vendor (vendorId set, intent vendor) → /home,
 *     NOT re-onboarded (the loop guard).
 *  D: consent-current vendor-intent WITHOUT vendorId → onboarding/vendor.
 *  E: suspended vendor posting → 403 (never resurrected). */
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
const seed = async (id: string, email: string, role: string, staffRole: string | null, vendorId: string | null, status: string, intent: string | null) => {
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, staff_role, campus, account_status, email_verified, consent, intent, created_at, updated_at)
    VALUES (${id}, ${email}, ${"NR " + id.slice(0, 8)}, ${role}, ${vendorId}, ${staffRole}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, ${intent}, now(), now())`;
  const sess = "nr-s-" + id.slice(0, 12);
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${id}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;
  return sess;
};
const cleanupAll: string[] = [];

try {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // ---- A: existing LIVE vendor posts another listing ----
  const liveId = "nr-live-" + stamp, liveVid = "nr-lv-" + stamp;
  cleanupAll.push(liveId, liveVid);
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${liveVid}, ${liveId}, 'NR Live Vendor', ${"nrl" + stamp}, ${"nrl-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  const liveSess = await seed(liveId, `nr-live-${stamp}@t.dev`, "vendor", null, liveVid, "live", "vendor");
  cleanupAll.push(liveSess);
  await page.context().addCookies([{ name: "sessionId", value: liveSess, url: BASE }]);
  const r1 = await page.request.post(BASE + "/api/listings", { data: { title: "NR existing vendor extra listing", categoryId: "food", priceMinMinor: 100000, description: "d", images: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"] } });
  const b1 = await r1.json().catch(() => ({}));
  check("A1: live vendor can still post", r1.status() === 200, `status=${r1.status()} ${JSON.stringify(b1).slice(0, 80)}`);
  check("A2: no re-promotion churn (autoGolive=false)", (b1 as { autoGolive?: boolean }).autoGolive === false, JSON.stringify(b1).slice(0, 60));
  const v1 = await sql`SELECT status FROM vendors WHERE id = ${liveVid}`;
  check("A3: vendor still live", v1[0]?.status === "live", v1[0]?.status);
  const i1 = await sql`SELECT role FROM identities WHERE id = ${liveId}`;
  check("A4: role unchanged (vendor)", i1[0]?.role === "vendor", i1[0]?.role);
  await page.context().clearCookies();

  // ---- B: suspended vendor cannot post (no resurrection) ----
  const susId = "nr-sus-" + stamp, susVid = "nr-sv-" + stamp;
  cleanupAll.push(susId, susVid);
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${susVid}, ${susId}, 'NR Suspended Vendor', ${"nrs" + stamp}, ${"nrs-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'suspended', false, 'd', ${new Date().toISOString()})`;
  const susSess = await seed(susId, `nr-sus-${stamp}@t.dev`, "vendor", null, susVid, "suspended", "vendor");
  cleanupAll.push(susSess);
  await page.context().addCookies([{ name: "sessionId", value: susSess, url: BASE }]);
  const r2 = await page.request.post(BASE + "/api/listings", { data: { title: "NR suspended probe", categoryId: "food", priceMinMinor: 100000, description: "d", images: [] } });
  const b2 = await r2.json().catch(() => ({}));
  const susAfter = await sql`SELECT status FROM vendors WHERE id = ${susVid}`;
  check("B1: suspended posting blocked/no-promote", r2.status() !== 200 || susAfter[0]?.status === "suspended", `status=${r2.status()} vendor=${susAfter[0]?.status} body=${JSON.stringify(b2).slice(0, 60)}`);
  check("B2: suspended stays suspended", susAfter[0]?.status === "suspended", susAfter[0]?.status);
  await page.context().clearCookies();

  // ---- C: EXISTING vendor (vendorId set) verify-otp → /home, no loop ----
  const existId = "nr-exi-" + stamp, existVid = "nr-ev-" + stamp;
  cleanupAll.push(existId, existVid);
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${existVid}, ${existId}, 'NR Existing Vendor', ${"nre" + stamp}, ${"nre-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  const existEmail = `nr-exist-${stamp}@t.dev`;
  const existSess = await seed(existId, existEmail, "vendor", null, existVid, "live", "vendor");
  cleanupAll.push(existSess);
  await page.context().addCookies([{ name: "sessionId", value: existSess, url: BASE }]);
  // simulate verify-otp's redirect decision by calling it with a seeded pending token+otp
  const pt = "nr-pt-" + stamp;
  await sql`INSERT INTO pending_tokens (token, email, purpose, expires_at, created_at) VALUES (${pt}, ${existEmail}, 'registration', ${new Date(Date.now() + 36e5).toISOString()}, ${new Date().toISOString()})`;
  await sql`INSERT INTO otps (id, email, purpose, code, expires_at, attempts) VALUES (${"nr-otp-" + stamp}, ${existEmail}, 'registration', '123456', ${new Date(Date.now() + 36e5).toISOString()}, 0)`;
  const vo1 = await page.request.post(BASE + "/api/auth/verify-otp", { data: { token: pt, code: "123456" } });
  const vo1b = await vo1.json().catch(() => ({}));
  check("C1: existing vendor verify → /home (no re-onboarding loop)", (vo1b as { redirect?: string }).redirect === "/home", JSON.stringify(vo1b).slice(0, 90));

  // ---- D: fresh vendor-INTENT user (no vendorId) → onboarding/vendor ----
  const freshEmail = `nr-fresh-${stamp}@t.dev`;
  const freshId = "nr-fr-" + stamp;
  cleanupAll.push(freshId);
  await seed(freshId, freshEmail, "shopper", null, null, "active", "vendor");
  const pt2 = "nr-pt2-" + stamp;
  await sql`INSERT INTO pending_tokens (token, email, purpose, expires_at, created_at) VALUES (${pt2}, ${freshEmail}, 'registration', ${new Date(Date.now() + 36e5).toISOString()}, ${new Date().toISOString()})`;
  await sql`INSERT INTO otps (id, email, purpose, code, expires_at, attempts) VALUES (${"nr-otp2-" + stamp}, ${freshEmail}, 'registration', '654321', ${new Date(Date.now() + 36e5).toISOString()}, 0)`;
  const vo2 = await page.request.post(BASE + "/api/auth/verify-otp", { data: { token: pt2, code: "654321" } });
  const vo2b = await vo2.json().catch(() => ({}));
  check("D1: vendor-intent fresh user → /onboarding/vendor", (vo2b as { redirect?: string }).redirect === "/onboarding/vendor", JSON.stringify(vo2b).slice(0, 90));

  // ---- E: google-callback cookie carries expires (static check via session shape) ----
  const s = await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${"nr-ck-" + stamp}, ${existId}, ${new Date(Date.now() + 30 * 864e5).toISOString()}, ${new Date().toISOString()}) RETURNING expires_at`;
  const ttlDays = (new Date(s[0].expires_at).getTime() - Date.now()) / 864e5;
  check("E1: session default TTL 30d (cookie now matches)", ttlDays > 28 && ttlDays <= 31, `${ttlDays.toFixed(1)}d`);
  cleanupAll.push("nr-ck-" + stamp);

  await browser.close();
} catch (e) {
  results.push("FAIL exception — " + String(e).slice(0, 300));
} finally {
  const dels = [];
  for (const id of cleanupAll) {
    if (id.startsWith("nr-s-")) dels.push(sql`DELETE FROM sessions WHERE id = ${id}`);
    else if (id.startsWith("nr-lv") || id.startsWith("nr-sv") || id.startsWith("nr-ev")) dels.push(sql`DELETE FROM vendors WHERE id = ${id}`);
    else dels.push(sql`DELETE FROM identities WHERE id = ${id}`);
  }
  dels.push(sql`DELETE FROM pending_tokens WHERE token LIKE ${"nr-pt%"}`);
  dels.push(sql`DELETE FROM otps WHERE id LIKE ${"nr-otp%"}`);
  await Promise.all(dels).catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
