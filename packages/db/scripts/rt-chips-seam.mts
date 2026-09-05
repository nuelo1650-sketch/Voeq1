/**
 * Round-trip for the CHIPS SEAM: resolvePublicCategories + resolveCategoryMaps
 * reflect the console-managed taxonomy. Against TEST DB via the real repo
 * path (the resolver dynamically imports @voeq/db, so DATABASE_URL must be
 * set to the test DB BEFORE the dynamic import resolves).
 * Run: npx tsx scripts/rt-chips-seam.mts (from packages/db)
 */
import { eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { getDb, schemaRef as s } from "../src/client.js";

// Set test DB BEFORE importing the resolver (dynamic import caches getDb too)
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const prodUrl = env.match(/DATABASE_URL=([^\n\r]+)/)[1];
process.env.DATABASE_URL = prodUrl.includes("/neondb?")
  ? prodUrl.replace("/neondb?", "/neondb_test?")
  : prodUrl.replace(/\/neondb$/, "/neondb_test");

const db = getDb();
const { resolvePublicCategories, resolveCategoryMaps } = await import("../../data/src/categories-resolver.js");
const { realCategoryRepo } = await import("../src/repos.js");

let failures = 0;
const check = (name: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
};
const stamp = Date.now();
const slugA = `rt-seam-a-${stamp}`;
const slugB = `rt-seam-b-${stamp}`;

// ---- 1. baseline: resolver returns seeded + DB merged taxonomy -------------
const base = await resolvePublicCategories();
check("resolver: seeded taxonomy present (>=19)", base.length >= 19, `got ${base.length}`);
check("resolver: all returned are active", base.every((c) => c.isActive !== false));
const baseMaps = await resolveCategoryMaps();
check("maps: slugToId has food-drinks -> food", baseMaps.slugToId["food-drinks"] === "food");

// ---- 2. console-create a category → it APPEARS in the taxonomy --------------
await realCategoryRepo.create({ slug: slugA, name: "Seam Test A" });
const withA = await resolvePublicCategories();
const rowA = withA.find((c) => c.slug === slugA);
check("created category appears in taxonomy", !!rowA, JSON.stringify(rowA?.name));
check("created category flagged source=db", rowA?.source === "db");
const mapsA = await resolveCategoryMaps();
check("created category resolves in maps (slug→id)", !!mapsA.slugToId[slugA]);
check("created category id→slug inverse works", mapsA.idToSlug[rowA!.id] === slugA);

// ---- 3. rename via console → label updates in taxonomy -----------------------
await realCategoryRepo.rename(slugA, "Seam Test A Renamed");
const renamed = (await resolvePublicCategories()).find((c) => c.slug === slugA);
check("console rename reflected in taxonomy", renamed?.name === "Seam Test A Renamed");

// ---- 4. deactivate → GONE from public taxonomy + maps -----------------------
await realCategoryRepo.setActive(slugA, false);
const deactivated = (await resolvePublicCategories()).find((c) => c.slug === slugA);
check("deactivated category EXCLUDED from taxonomy", !deactivated);
const mapsOff = await resolveCategoryMaps();
check("deactivated category EXCLUDED from maps", !mapsOff.slugToId[slugA]);

// ---- 5. seeded category rename + deactivate flows (id stable) ---------------
// rename a real seeded category, verify, then restore
const seededSlug = "books";
const orig = (await resolvePublicCategories()).find((c) => c.slug === seededSlug);
await realCategoryRepo.rename(seededSlug, "Books & Materials TEMP");
const tempRenamed = (await resolvePublicCategories()).find((c) => c.slug === seededSlug);
check("seeded rename reflected (id preserved)", tempRenamed?.name === "Books & Materials TEMP" && tempRenamed?.id === orig?.id);
await realCategoryRepo.rename(seededSlug, orig!.name); // restore
const restored = (await resolvePublicCategories()).find((c) => c.slug === seededSlug);
check("seeded rename restored", restored?.name === orig?.name);

// ---- cleanup ------------------------------------------------------------------
await db.delete(s.categories).where(eq(s.categories.slug, slugA));
await db.delete(s.categories).where(eq(s.categories.slug, slugB));
const left = (await resolvePublicCategories()).filter((c) => c.slug.startsWith("rt-seam-"));
check("cleanup: no probe categories remain", left.length === 0);

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
