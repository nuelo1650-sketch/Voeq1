/** Verify TRUE block (title flip on low-desc listing) + flagged-notification. */
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const BASE = "http://localhost:3031";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const TEST_URL = env.match(/DATABASE_URL=([^\n\r]+)/)[1].replace("/neondb?", "/neondb_test?");
const sql = neon(TEST_URL);
const stamp = Date.now();

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.request.post(`${BASE}/api/dev/vendor-session`, { data: { vendorId: "v1" } });
const cookies = await ctx.cookies();
const H = { "Content-Type": "application/json", Cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; ") };

// dedicated test listing (not the C4 fixture — its own row via insert)
const lid = "integ-test-" + stamp;
await sql`INSERT INTO listings (id, vendor_id, title, price_min_minor, is_published, images, category_id, description, status, price_minor)
VALUES (${lid}, 'v1', 'Handmade Beaded Necklace', 350000, true, ${JSON.stringify([])}::jsonb, 'fashion', 'Handcrafted bead necklace with matching earrings set', 'active', 350000)`;
console.log(`created test listing ${lid.slice(0, 16)}…`);

// seed engagement: 2 saves
const shoppers = (await sql`SELECT id FROM identities WHERE role = 'shopper' LIMIT 2`);
for (let i = 0; i < shoppers.length; i++) {
  await sql`INSERT INTO wishlist_items (id, shopper_id, listing_id, created_at) VALUES (${"ts-" + stamp + i}, ${shoppers[i].id}, ${lid}, ${new Date().toISOString()})`;
}

// A) TRUE different product: title flip + description flip (same category by force of tier C, but desc flip drags similarity down)
const rA = await fetch(`${BASE}/api/listings/${lid}`, {
  method: "PATCH", headers: H,
  body: JSON.stringify({ title: "Refurbished Dell Laptop Core i5", description: "Clean UK-used laptop with charger, 8GB RAM and 256GB SSD" }),
});
const bA = await rA.json();
console.log(`A) different-product: status=${rA.status} error=${(bA as any).error} similarity=${(bA as any).similarity}`);

// B) flagged band: moderate change
const rB = await fetch(`${BASE}/api/listings/${lid}`, {
  method: "PATCH", headers: H,
  body: JSON.stringify({ title: "Handmade Beaded Necklace Gold Edition" }),
});
const bB = await rB.json();
console.log(`B) moderate change: status=${rB.status} integrity=${JSON.stringify((bB as any).integrity)}`);

// notification to savers?
const notifs = await sql`SELECT recipient_id, title FROM notifications WHERE ref_id = ${lid}`;
console.log(`saver notifications: ${notifs.length} (want 2)`);

// audit trail
const audit = await sql`SELECT action, similarity FROM listing_edits WHERE listing_id = ${lid} ORDER BY at`;
console.log("audit:", JSON.stringify(audit));

// restore original title for cleanliness then cleanup
await fetch(`${BASE}/api/listings/${lid}`, { method: "DELETE", headers: H });
await sql`DELETE FROM listing_edits WHERE listing_id = ${lid}`;
await sql`DELETE FROM wishlist_items WHERE listing_id = ${lid}`;
await sql`DELETE FROM notifications WHERE ref_id = ${lid}`;
const left = await sql`SELECT count(*)::int AS n FROM listings WHERE id = ${lid}`;
console.log(`cleanup: listing rows left = ${left[0].n} (want 0)`);
await browser.close();
console.log("== FINAL INTEGRITY VERIFY DONE ==");
