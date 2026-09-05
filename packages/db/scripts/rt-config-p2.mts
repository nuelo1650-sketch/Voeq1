/**
 * Round-trip for Config Console P2: the two NEW repo methods —
 * realCategoryRepo.rename + realFeatureFlagRepo.set upsert (flag create).
 * Against TEST DB, real code path, self-cleaning.
 * Run: npx tsx scripts/rt-config-p2.mts (from packages/db)
 */
import { eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { getDb, schemaRef as s } from "../src/client.js";
import { realCategoryRepo, realFeatureFlagRepo } from "../src/repos.js";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const prodUrl = env.match(/DATABASE_URL=([^\n\r]+)/)[1];
process.env.DATABASE_URL = prodUrl.includes("/neondb?")
  ? prodUrl.replace("/neondb?", "/neondb_test?")
  : prodUrl.replace(/\/neondb$/, "/neondb_test");

const db = getDb();
let failures = 0;
const check = (name: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
};

// ---- rename ------------------------------------------------------------------
const slug = `rt-p2-cat-${Date.now()}`;
const created = await realCategoryRepo.create({ slug, name: "P2 Original" });
const renamed = await realCategoryRepo.rename(slug, "P2 Renamed");
check("rename returns updated name", renamed?.name === "P2 Renamed", `got ${renamed?.name}`);
const raw: any[] = await db.select().from(s.categories).where(eq(s.categories.slug, slug));
check("rename persisted to DB", raw[0]?.name === "P2 Renamed");
check("rename keeps slug stable", renamed?.slug === slug);
const missing = await realCategoryRepo.rename("no-such-slug-xyz", "X");
check("rename on missing slug returns null", missing === null);

// ---- flag upsert (create path) -------------------------------------------------
const flagKey = `rt.p2.flag.${Date.now()}`;
const f1 = await realFeatureFlagRepo.set(flagKey, true, "rt p2 probe");
check("flag set (create) returns row", f1?.key === flagKey && f1?.value === true);
const rawF: any[] = await db.select().from(s.featureFlags).where(eq(s.featureFlags.key, flagKey));
check("flag row persisted with description", rawF[0]?.description === "rt p2 probe");
const f2 = await realFeatureFlagRepo.set(flagKey, false);
check("flag set (toggle) flips value", f2?.value === false);
const f3 = await realFeatureFlagRepo.set(flagKey, true, "");
check("flag set keeps original description when empty", f3?.description === "rt p2 probe", `got ${f3?.description}`);
const f4 = await realFeatureFlagRepo.set(flagKey, false, "deliberate re-description");
check("flag set overwrites description when non-empty", f4?.description === "deliberate re-description");

// ---- cleanup --------------------------------------------------------------------
await db.delete(s.categories).where(eq(s.categories.slug, slug));
await db.delete(s.featureFlags).where(eq(s.featureFlags.key, flagKey));
const lc: any[] = await db.select().from(s.categories).where(eq(s.categories.slug, slug));
const lf: any[] = await db.select().from(s.featureFlags).where(eq(s.featureFlags.key, flagKey));
check("cleanup: category removed", lc.length === 0);
check("cleanup: flag removed", lf.length === 0);

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
