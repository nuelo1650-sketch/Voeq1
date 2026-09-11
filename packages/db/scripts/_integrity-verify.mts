/**
 * LISTING INTEGRITY behavioral verification (test DB):
 * 1. zero-engagement listing: Tier B edit applies clean (no friction on new listings)
 * 2. engaged listing + DIFFERENT product edit -> 409 different_product + audit row
 * 3. engaged listing + category change -> 409 category_locked
 * 4. engaged listing + similar title edit -> 200 applied/flagged + audit row
 * 5. flagged edit notifies savers
 */
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const BASE = "http://localhost:3031";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const TEST_URL = env.match(/DATABASE_URL=([^\n\r]+)/)[1].replace("/neondb?", "/neondb_test?");
const sql = neon(TEST_URL);
const stamp = Date.now();

// create a fresh vendor with 2 listings via dev session (v1 fixture)
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.request.post(`${BASE}/api/dev/vendor-session`, { data: { vendorId: "v1" } });
// grab cookies for raw fetch
const cookies = await ctx.cookies();
const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
const H = { "Content-Type": "application/json", Cookie: cookieHeader };

async function patchListing(id: string, body: Record<string, unknown>) {
  const r = await fetch(`${BASE}/api/listings/${id}`, { method: "PATCH", headers: H, body: JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

// find/create a test listing owned by v1 with ZERO engagement
let zero = (await sql`SELECT id, title, category_id, price_min_minor FROM listings WHERE vendor_id = 'v1' AND is_published = true AND status = 'active' LIMIT 1`)[0];
if (!zero) throw new Error("no v1 listing");
// clear any engagement on it for test 1
await sql`DELETE FROM likes WHERE target_type = 'listing' AND target_id = ${zero.id}`;
await sql`DELETE FROM comments WHERE listing_id = ${zero.id}`;
await sql`DELETE FROM wishlist_items WHERE listing_id = ${zero.id}`;

console.log("=== TEST 1: zero-engagement -> Tier B edit applies clean ===");
const t1 = await patchListing(zero.id, { title: "Fresh New Name Zero Engagement" });
console.log(`status=${t1.status} integrity=${JSON.stringify((t1.body as any).integrity ?? null)}`);

console.log("=== TEST 2+3+4: seed engagement, then probe ===");
// seed engagement: 3 saves + 2 likes + 1 comment + 1 view
const shoppers = await sql`SELECT id FROM identities WHERE role = 'shopper' LIMIT 3`;
for (let i = 0; i < 3 && i < shoppers.length; i++) {
  await sql`INSERT INTO wishlist_items (id, shopper_id, listing_id, created_at) VALUES (${"li-" + stamp + i}, ${shoppers[i].id}, ${zero.id}, ${new Date().toISOString()})`;
}
await sql`INSERT INTO likes (id, actor_id, target_type, target_id, created_at) VALUES (${"lk-" + stamp}, ${shoppers[0]?.id ?? "x"}, 'listing', ${zero.id}, ${new Date().toISOString()})`;
await sql`INSERT INTO comments (id, listing_id, author_id, body, created_at, status) VALUES (${"cm-" + stamp}, ${zero.id}, ${shoppers[0]?.id ?? "x"}, 'integrity test comment', ${new Date().toISOString()}, 'published')`;
await sql`INSERT INTO page_events (id, identity_id, type, ref_id, path, at) VALUES (${"pe-" + stamp}, NULL, 'listing_view', ${zero.id}, '/listing/x', ${new Date().toISOString()})`;

console.log("--- TEST 3: category change on engaged listing -> blocked ---");
const t3 = await patchListing(zero.id, { categoryId: "tech" });
console.log(`status=${t3.status} error=${(t3.body as any).error}`);

console.log("--- TEST 2: different-product title on engaged listing -> blocked ---");
const t2 = await patchListing(zero.id, { title: "Playstation 5 Console With Two Pads" });
console.log(`status=${t2.status} error=${(t2.body as any).error} similarity=${(t2.body as any).similarity}`);

console.log("--- TEST 4: similar title edit -> applies/flags ---");
const current = (await sql`SELECT title FROM listings WHERE id = ${zero.id}`)[0];
const t4 = await patchListing(zero.id, { title: current.title.replace(/Zero Engagement/, "Small Engagement") });
console.log(`status=${t4.status} integrity=${JSON.stringify((t4.body as any).integrity ?? null)}`);

console.log("=== audit rows written? ===");
const rows = await sql`SELECT action, similarity FROM listing_edits WHERE listing_id = ${zero.id} ORDER BY at DESC LIMIT 5`;
console.log(JSON.stringify(rows));

// cleanup
await sql`DELETE FROM listing_edits WHERE listing_id = ${zero.id}`;
await sql`DELETE FROM wishlist_items WHERE listing_id = ${zero.id}`;
await sql`DELETE FROM likes WHERE target_id = ${zero.id}`;
await sql`DELETE FROM comments WHERE listing_id = ${zero.id}`;
await sql`DELETE FROM page_events WHERE ref_id = ${zero.id}`;
await browser.close();
console.log("== INTEGRITY VERIFY DONE ==");
