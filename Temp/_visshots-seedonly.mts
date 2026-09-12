/** seed-only fixtures for the comparison shots (test DB) */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1].replace(/^"|"$/g, "").replace("/neondb?", "/neondb_test?");
const sql = neon(dbUrl);
const stamp = "cmp" + Date.now().toString(36);
const consent = JSON.stringify([{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: new Date().toISOString(), method: "email" }]);
const img = (id: number) => `https://picsum.photos/id/${id}/900/600`;
const vendors = [
  { vid: "vv1", name: "Mama Tuli's Kitchen", verified: true },
  { vid: "vv2", name: "Campus Kicks", verified: true },
  { vid: "vv3", name: "Braids by Zina", verified: false },
  { vid: "vv4", name: "TechFix NMU", verified: true },
];
const listings = [
  { id: "jollof", vid: "vv1", title: "Party Jollof + Grilled Chicken", price: 350000, cat: "food", featured: true, fresh: false, imgs: [img(1060), img(429), img(292)] },
  { id: "friedrice", vid: "vv1", title: "Fried Rice & Turkey, Full Plate", price: 280000, cat: "food", featured: false, fresh: true, imgs: [img(823), img(5)] },
  { id: "meatpie", vid: "vv1", title: "Meat Pie (Pack of 4)", price: 150000, cat: "food", featured: false, fresh: false, imgs: [img(292), img(1060)] },
  { id: "cakes", vid: "vv1", title: "Custom Birthday Cake, 2-Tier", price: 2200000, cat: "food", featured: true, fresh: false, imgs: [img(235), img(1025)] },
  { id: "airforce", vid: "vv2", title: "Nike Air Force 1, Clean", price: 850000, cat: "fashion", featured: false, fresh: true, imgs: [img(1082), img(755)] },
  { id: "ankara", vid: "vv2", title: "Ankara Two-Piece, Tailored", price: 450000, cat: "fashion", featured: true, fresh: false, imgs: [img(996), img(115)] },
  { id: "tees", vid: "vv2", title: "Plain Tees, Bulk 5-Pack", price: 125000, cat: "fashion", featured: false, fresh: false, imgs: [img(452), img(669)] },
  { id: "braids", vid: "vv3", title: "Knotless Braids, Any Length", price: 400000, cat: "hair", featured: true, fresh: false, imgs: [img(1027), img(644)] },
  { id: "edges", vid: "vv3", title: "Quick Weave with Edges", price: 300000, cat: "hair", featured: false, fresh: true, imgs: [img(342), img(823)] },
  { id: "screen", vid: "vv4", title: "iPhone Screen Repair, Same Day", price: 350000, cat: "gadgets", featured: false, fresh: false, imgs: [img(0), img(48)] },
  { id: "charge", vid: "vv4", title: "Laptop Charging Port Fix", price: 250000, cat: "gadgets", featured: false, fresh: true, imgs: [img(48), img(0)] },
  { id: "powerbank", vid: "vv4", title: "20,000mAh Power Bank", price: 180000, cat: "gadgets", featured: false, fresh: false, imgs: [img(0), img(48)] },
];
for (const v of vendors) {
  const vid = `vis-${v.vid}-${stamp}`, iid = `vis-i-${v.vid}-${stamp}`;
  await sql`INSERT INTO identities (id, email, name, role, vendor_id, campus, account_status, email_verified, consent, created_at, updated_at)
    VALUES (${iid}, ${`vis-${v.vid}-${stamp}@t.dev`}, ${v.name}, 'vendor', ${vid}, 'nmu-okerenkoko', 'active', true, ${consent}::jsonb, now(), now())`;
  await sql`INSERT INTO vendors (id, identity_id, name, handle, slug, campus, category_ids, status, verified, description, agreement_accepted_at)
    VALUES (${vid}, ${iid}, ${v.name}, ${`cmp${v.vid}${stamp}`}, ${`cmp-${v.vid}-${stamp}`}, 'nmu-okerenkoko', '["food","fashion","hair","gadgets"]'::jsonb, 'live', ${v.verified}, 'Real food, real fast — the campus stall everyone knows.', ${new Date(Date.now() - 400 * 864e5).toISOString()})`;
}
for (const l of listings) {
  const vid = `vis-${l.vid}-${stamp}`;
  const created = l.fresh ? new Date(Date.now() - 8 * 3600e3).toISOString() : new Date(Date.now() - 20 * 864e5).toISOString();
  await sql`INSERT INTO listings (id, vendor_id, title, description, category_id, price_min_minor, price_minor, is_published, status, images, is_featured, created_at, source, short_description)
    VALUES (${'vis-' + l.id + '-' + stamp}, ${vid}, ${l.title}, 'The campus favorite — made fresh daily, big portions, fair price.', ${l.cat}, ${l.price}, ${l.price}, true, 'active', ${JSON.stringify(l.imgs)}::jsonb, ${l.featured}, ${created}, null::text, 'd')`;
}
console.log("seeded stamp=" + stamp);
