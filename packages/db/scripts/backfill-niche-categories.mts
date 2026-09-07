/** NICHE EXPANSION (2026-09-07): insert the 8 new categories into the
 *  categories table (prod by default, --test for test DB). Idempotent:
 *  ON CONFLICT (id) DO NOTHING — never renames or deactivates existing rows.
 *  Usage: npx tsx scripts/backfill-niche-categories.mts [--test] */
import { readFileSync } from "node:fs";

const envText = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
let dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)![1];
if (process.argv.includes("--test")) dbUrl = dbUrl.replace("/neondb?", "/neondb_test?");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(dbUrl);

const NEW = [
  { id: "pastries", name: "Pastries & Bakes", slug: "pastries" },
  { id: "drinks", name: "Drinks & Smoothies", slug: "drinks" },
  { id: "skincare", name: "Skincare", slug: "skincare" },
  { id: "fitness", name: "Fitness & Gains", slug: "fitness" },
  { id: "hair", name: "Hair Services", slug: "hair-services" },
  { id: "gadgets", name: "Gadgets & Accessories", slug: "gadgets" },
  { id: "crafts", name: "Crafts & handmade", slug: "crafts" },
  { id: "music", name: "Music & DJ", slug: "music-services" },
];

for (const c of NEW) {
  await sql`
    INSERT INTO categories (id, name, slug, is_active)
    VALUES (${c.id}, ${c.name}, ${c.slug}, true)
    ON CONFLICT (id) DO NOTHING`;
  console.log("ensured:", c.id, c.name);
}
const rows = await sql`SELECT count(*) AS n FROM categories`;
console.log("total categories now:", rows[0].n);
process.exit(0);
