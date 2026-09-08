/** REGRESSION: publish=go-live must create the admin verification case AND
 *  notify the vendor (founder 2026-09-08: "new vendors are not being seen in
 *  admin for verification of their account... a notification should appear
 *  in their dashboard that it has worked").
 *  Round-trip against the TEST DB via the real /api/listings POST + real
 *  repos. Idempotency: a second publish must NOT duplicate the case.
 *  Full cleanup at the end (child-first). */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;

const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);
const { mockStaffRepo, mockVendorRepo } = await import("../../data/src/mock.ts");
const { mockNotificationRepo } = await import("../../data/src/shopper.ts");

const stamp = Date.now().toString(36);
const BASE = "http://localhost:3031";
const iid = "vi-i-" + stamp, vid = "vi-v-" + stamp, sess = "vi-s-" + stamp, lid = "vi-l-" + stamp;
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);

try {
  // 1) Seed a pending_listings vendor (agreement accepted, no listing yet)
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"vi-" + stamp + "@t.dev"}, 'VI Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'VI Vendor', ${"viv" + stamp}, ${"vi-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'pending_listings', false, 'd', ${new Date().toISOString()})`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${iid}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;

  const before = (await mockVendorRepo.getById(vid))!;
  check("P1: seeded vendor starts pending_listings", before.status === "pending_listings", `status=${before.status}`);

  // 2) Publish their first listing via the REAL API (publish=go-live path)
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  await ctx.addCookies([{ name: "sessionId", value: sess, url: BASE }]);
  const page = await ctx.newPage();
  const res = await page.request.post(`${BASE}/api/listings`, {
    data: { title: "VI TestListing", description: "regression probe listing", categoryId: "food", priceMinMinor: 50000, images: [], isPublished: true },
  });
  const body = (await res.json()) as { ok?: boolean; autoGolive?: boolean; listing?: { id?: string } };
  check("P2: POST /api/listings 200 ok", res.status() === 200 && body.ok === true, `status=${res.status()} autoGolive=${body.autoGolive}`);
  check("P3: autoGolive=true (publish promoted pending vendor)", body.autoGolive === true, `autoGolive=${body.autoGolive}`);

  // 3) Vendor is now LIVE
  const after = (await mockVendorRepo.getById(vid))!;
  check("P4: vendor status LIVE after publish", after.status === "live", `status=${after.status}`);

  // 4) The verification case EXISTS for admin (the founder's core complaint)
  const cases = await mockStaffRepo.listCases("verifications");
  const mine = cases.filter((c) => (c.payload as Record<string, unknown> | null)?.vendorId === vid);
  check("P5: verification case created in admin queue", mine.length === 1, `n=${mine.length}`);
  check("P6: case is open + pending_verification", mine.length === 1 && mine[0].status === "open" && mine[0].decision === "pending_verification", `status=${mine[0]?.status} decision=${mine[0]?.decision}`);

  // 5) The vendor got their dashboard notification
  const notifs = await mockNotificationRepo.list(iid);
  const live = notifs.find((n) => n.type === "system" && /live/i.test(n.title));
  check("P7: vendor notified (system, 'You're live 🎉')", !!live, `titles=${notifs.map((n) => n.title).join("|")}`);

  // 6) IDEMPOTENCY: second publish (new listing) must NOT duplicate the case
  const res2 = await page.request.post(`${BASE}/api/listings`, {
    data: { title: "VI TestListing 2", description: "second listing — idempotency check", categoryId: "food", priceMinMinor: 30000, images: [], isPublished: true },
  });
  const body2 = (await res2.json()) as { ok?: boolean; autoGolive?: boolean };
  check("P8: second publish succeeds, autoGolive=false (already live)", res2.status() === 200 && body2.autoGolive === false, `status=${res2.status()} autoGolive=${body2.autoGolive}`);
  const cases2 = await mockStaffRepo.listCases("verifications");
  const mine2 = cases2.filter((c) => (c.payload as Record<string, unknown> | null)?.vendorId === vid && c.status !== "resolved" && c.status !== "dismissed");
  check("P9: still exactly ONE open case for this vendor (no dupes)", mine2.length === 1, `n=${mine2.length}`);

  await browser.close();
} finally {
  // child-first cleanup
  await sql`DELETE FROM notifications WHERE recipient_id = ${iid}`.catch(() => {});
  await sql`DELETE FROM staff_cases WHERE payload->>'vendorId' = ${vid}`.catch(() => {});
  await sql`DELETE FROM listings WHERE vendor_id = ${vid}`.catch(() => {});
  await sql`DELETE FROM vendors WHERE id = ${vid}`.catch(() => {});
  await sql`DELETE FROM sessions WHERE id = ${sess}`.catch(() => {});
  await sql`DELETE FROM identities WHERE id = ${iid}`.catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
