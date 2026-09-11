/** Re-run JUST test 2 with detailed output (the different-product block). */
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const BASE = "http://localhost:3031";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const TEST_URL = env.match(/DATABASE_URL=([^\n\r]+)/)[1].replace("/neondb?", "/neondb_test?");
const sql = neon(TEST_URL);
const stamp = Date.now();

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.request.post(`${BASE}/api/dev/vendor-session`, { data: { vendorId: "v1" } });
const cookies = await ctx.cookies();
const H = { "Content-Type": "application/json", Cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; ") };

const zero = (await sql`SELECT id, title, price_min_minor FROM listings WHERE vendor_id = 'v1' AND is_published = true AND status = 'active' LIMIT 1`)[0];
console.log(`listing: "${zero.title}" (price ${zero.price_min_minor})`);

// seed engagement
const shopper = (await sql`SELECT id FROM identities WHERE role = 'shopper' LIMIT 1`)[0];
await sql`INSERT INTO wishlist_items (id, shopper_id, listing_id, created_at) VALUES (${"t2s-" + stamp}, ${shopper.id}, ${zero.id}, ${new Date().toISOString()})`;
await sql`INSERT INTO page_events (id, identity_id, type, ref_id, path, at) VALUES (${"t2v-" + stamp}, NULL, 'listing_view', ${zero.id}, '/listing/x', ${new Date().toISOString()})`;

// current title (post test-4 of last run)
const r = await fetch(`${BASE}/api/listings/${zero.id}`, {
  method: "PATCH", headers: H,
  body: JSON.stringify({ title: "Sony Playstation Five Console Boxed" }),
});
console.log(`different-product edit -> status=${r.status}`);
const b = await r.json();
console.log(JSON.stringify(b).slice(0, 300));

// audit row check
const audit = await sql`SELECT action, similarity, fields FROM listing_edits WHERE listing_id = ${zero.id} ORDER BY at DESC LIMIT 1`;
console.log("audit:", JSON.stringify(audit));

// cleanup
await sql`DELETE FROM listing_edits WHERE listing_id = ${zero.id}`;
await sql`DELETE FROM wishlist_items WHERE listing_id = ${zero.id}`;
await sql`DELETE FROM page_events WHERE ref_id = ${zero.id}`;
await browser.close();
console.log("== T2 RETEST DONE ==");
