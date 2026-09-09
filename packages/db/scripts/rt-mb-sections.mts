/** MONEY BAG A3 — round-trip probe: /api/explore?sections=1 vs TEST DB.
 *  Verifies: (1) sections payload exists when asked, (2) freshDrops = real-only
 *  72h window, (3) crowd-flow — seeds excluded from drops, backfill only in grid,
 *  real-first ordering, (4) old shape (no sections param) unchanged — backwards
 *  compatible. Seeds via direct insert with source='seed'.
 *  Usage: dev server on :3031 required. npx tsx scripts/rt-mb-sections.mts
 */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace("/neondb?", "/neondb_test?");
process.env.DATABASE_URL = dbUrl;
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const BASE = "http://localhost:3031";
const stamp = Date.now().toString(36);
const iid = "mb-i-" + stamp, vid = "mb-v-" + stamp, sess = "mb-s-" + stamp;
const results: string[] = [];
const check = (n: string, ok: boolean, d = "") => results.push(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`);
const realIds: string[] = [];
const seedIds: string[] = [];

try {
  // seed: live vendor
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${"mb-" + stamp + "@t.dev"}, 'MB Vendor', 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true,
      ${JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }])}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, 'MB Vendor', ${"mbv" + stamp}, ${"mb-" + stamp}, 'nmu-okerenkoko', '["food"]'::jsonb, 'live', true, 'd', ${new Date().toISOString()})`;
  await sql`INSERT INTO sessions (id, identity_id, expires_at, created_at) VALUES (${sess}, ${iid}, ${new Date(Date.now() + 864e5).toISOString()}, ${new Date().toISOString()})`;

  // 3 real listings (one fresh, one old-outside-72h, one featured)
  const mkListing = async (id: string, title: string, opts: { featured?: boolean; createdDaysAgo?: number; seed?: boolean }) => {
    const created = new Date(Date.now() - (opts.createdDaysAgo ?? 0) * 86400 * 1000).toISOString();
    await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_min_minor, is_published, status, images, is_featured, created_at, source)
      VALUES (${id}, ${vid}, ${title}, 'd', 'food', 50000, true, 'active', ${JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg"])}::jsonb, ${opts.featured ?? false}, ${created}, ${opts.seed ? "seed" : null}::text)`;
    (opts.seed ? seedIds : realIds).push(id);
  };
  await mkListing("mb-l-fresh-" + stamp, "MB Fresh Real", { createdDaysAgo: 0 });
  await mkListing("mb-l-old-" + stamp, "MB Old Real (outside 72h)", { createdDaysAgo: 5 });
  await mkListing("mb-l-feat-" + stamp, "MB Featured Real", { featured: true, createdDaysAgo: 1 });
  // 4 seed listings (should only backfill the grid, never drops)
  for (let i = 0; i < 4; i++) {
    await mkListing(`mb-l-seed${i}-` + stamp, `MB Seed ${i}`, { seed: true, createdDaysAgo: 0 });
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1) sections payload
  const res = await page.request.get(`${BASE}/api/explore?campus=nmu-okerenkoko&sections=1`);
  const body = await res.json();
  check("S1: sections payload exists", !!body.sections, `keys=${body.sections ? Object.keys(body.sections).join(",") : "MISSING"}`);

  const dropsIds: string[] = (body.sections?.freshDrops ?? []).map((x: { id: string }) => x.id);
  const gridIds: string[] = (body.sections?.grid ?? []).map((x: { id: string }) => x.id);
  const liveIds: string[] = (body.sections?.live ?? []).map((x: { id: string }) => x.id);

  // 2) freshDrops: real-only + 72h
  check("S2: fresh drops exclude seeds", dropsIds.every((id) => !id.startsWith("mb-l-seed")), `drops=${dropsIds.join(",")}`);
  check("S3: fresh drops exclude 5-day-old listing (outside 72h)", !dropsIds.some((id) => id.includes("-old-")));
  const freshApi = (body.sections?.freshDrops ?? []).find((x: { id: string }) => x.id.includes("-fresh-"));
  const g0 = (body.sections?.grid ?? [])[0];
  check("S4: fresh drops include the fresh real listing", dropsIds.some((id) => id.includes("-fresh-")));

  // 3) crowd-flow: real first, seeds backfill (3 real + 4 seeds = 7 total, cap 8)
  const firstReal = gridIds.findIndex((id) => !id.startsWith("mb-l-seed"));
  const firstSeed = gridIds.findIndex((id) => id.startsWith("mb-l-seed"));
  check("S5: grid real-first ordering", firstReal !== -1 && (firstSeed === -1 || firstReal < firstSeed), `firstReal=${firstReal} firstSeed=${firstSeed}`);
  check("S6: all 3 real listings in grid", realIds.every((id) => gridIds.includes(id)));
  check("S7: seeds backfill grid (cap allows 4, have 3 real)", seedIds.filter((id) => gridIds.includes(id)).length === 4, `seedsInGrid=${gridIds.filter((id) => id.startsWith("mb-l-seed")).length}`);

  // 4) live shelf = featured real
  check("S8: live shelf = the featured real listing", liveIds.length === 1 && liveIds[0].includes("-feat-"), `live=${liveIds.join(",")}`);
  check("S9: seeds excluded from live shelf", liveIds.every((id) => !id.startsWith("mb-l-seed")));

  // 5) BACKWARDS COMPAT: no sections param = old shape, no sections key
  const res2 = await page.request.get(`${BASE}/api/explore?campus=nmu-okerenkoko`);
  const body2 = await res2.json();
  check("S10: old shape unchanged (no sections key)", body2.sections === undefined && Array.isArray(body2.data));
  check("S11: old shape still returns listings", Array.isArray(body2.data) && body2.data.length >= 7, `n=${body2.data?.length}`);

  await browser.close();
} finally {
  await Promise.all([
    sql`DELETE FROM listings WHERE title LIKE 'MB %'`,
    sql`DELETE FROM vendors WHERE name = 'MB Vendor'`,
    sql`DELETE FROM sessions WHERE identity_id = ${iid}`,
    sql`DELETE FROM identities WHERE id = ${iid}`,
  ]).catch(() => {});
}
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(fails.length ? `FAILED: ${fails.length}` : "ALL PASS");
process.exit(fails.length ? 1 : 0);
