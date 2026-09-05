/**
 * Round-trip test for Config Console P0: realCategoryRepo.create/setActive
 * and realAgreementRepo.setCurrent kind-scoping. Runs against the TEST DB
 * (neondb_test) via the real Drizzle code path. Cleans up after itself.
 * Run: npx tsx scripts/rt-config-p0.mts   (from packages/db)
 */
import { eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { getDb, schemaRef as s } from "../src/client.js";
import { realCategoryRepo, realAgreementRepo } from "../src/repos.js";

// Test DB URL = prod URL with the DATABASE name rewritten (anchored on the
// `?` so the ROLE name `neondb_owner` is never touched — naive /neondb
// replacement corrupts the username and auth fails).
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const prodUrl = env.match(/DATABASE_URL=([^\n\r]+)/)[1];
process.env.DATABASE_URL = prodUrl.includes("/neondb?")
  ? prodUrl.replace("/neondb?", "/neondb_test?")
  : prodUrl.replace(/\/neondb$/, "/neondb_test");

const db = getDb();
const stamp = Date.now();
const catSlug = `rt-p0-cat-${stamp}`;
let failures = 0;
const check = (name: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
};

// ---- 1. category create --------------------------------------------------
const created = await realCategoryRepo.create({ slug: catSlug, name: "RT P0 Category" });
check("create returns row with isActive=true", created.isActive === true, `id=${created.id}`);
const rawCreated: any[] = await db.select().from(s.categories).where(eq(s.categories.slug, catSlug));
check("create persisted to DB", rawCreated.length === 1 && rawCreated[0].name === "RT P0 Category");

// slug collision returns existing (mock/campus contract parity)
const again = await realCategoryRepo.create({ slug: catSlug, name: "Different Name" });
check("create slug-collision returns existing row", again.id === created.id);

// ---- 2. list() shape -------------------------------------------------------
const listed = await realCategoryRepo.list();
const rtRow = listed.find((c: any) => c.slug === catSlug);
check("list() returns Category shape (color/icon/vendorCount present)",
  !!rtRow && typeof rtRow.color === "string" && typeof rtRow.icon === "string" && rtRow.vendorCount === 0);
// Design: isActive is ABSENT when true (mock seeded rows have no DB state;
// absent = active). list() must surface it as false when deactivated.
check("list() shows created category as active (absent-or-true)", rtRow?.isActive !== false);

// ---- 3. setActive ----------------------------------------------------------
const off = await realCategoryRepo.setActive(catSlug, false);
check("setActive(false) returns updated row", off?.isActive === false);
const rawOff: any[] = await db.select().from(s.categories).where(eq(s.categories.slug, catSlug));
check("setActive(false) persisted", rawOff[0].isActive === false);
const listedOff = (await realCategoryRepo.list()).find((c: any) => c.slug === catSlug);
check("list() surfaces isActive=false after deactivation", listedOff?.isActive === false);
const on = await realCategoryRepo.setActive(catSlug, true);
check("setActive(true) round-trip", on?.isActive === true);
const missing = await realCategoryRepo.setActive("no-such-slug-xyz", false);
check("setActive on missing slug returns null", missing === null);

// ---- 4. agreement setCurrent kind-scoping ---------------------------------
// Seed: terms v1 (current) + privacy v1 (current). Publish privacy v2 →
// privacy v1 must lose isCurrent, terms v1 must KEEP it.
const t1 = await realAgreementRepo.create({ kind: "terms", version: "rt-p0-t1", body: "rt" });
const p1 = await realAgreementRepo.create({ kind: "privacy", version: "rt-p0-p1", body: "rt" });
const p2 = await realAgreementRepo.create({ kind: "privacy", version: "rt-p0-p2", body: "rt" });
await db.update(s.agreements).set({ isCurrent: true }).where(eq(s.agreements.id, t1.id));
await db.update(s.agreements).set({ isCurrent: true }).where(eq(s.agreements.id, p1.id));
const setRes = await realAgreementRepo.setCurrent(p2.id);
check("setCurrent returns the promoted agreement", setRes?.id === p2.id);
const currents: any[] = await db.select().from(s.agreements);
const t1row = currents.find((a) => a.id === t1.id);
const p1row = currents.find((a) => a.id === p1.id);
const p2row = currents.find((a) => a.id === p2.id);
check("privacy v1 de-currented (same kind)", p1row.isCurrent === false);
check("terms v1 STAYED current (kind-scoped reset)", t1row.isCurrent === true,
  `this is the P0 bug the old table-wide reset would have flipped`);
check("privacy v2 is current", p2row.isCurrent === true);
const missingSet = await realAgreementRepo.setCurrent("no-such-agreement");
check("setCurrent on missing id returns null", missingSet === null);

// ---- cleanup ---------------------------------------------------------------
await db.delete(s.categories).where(eq(s.categories.slug, catSlug));
await db.delete(s.agreements).where(eq(s.agreements.version, "rt-p0-t1"));
await db.delete(s.agreements).where(eq(s.agreements.version, "rt-p0-p1"));
await db.delete(s.agreements).where(eq(s.agreements.version, "rt-p0-p2"));
const leftoverCats: any[] = await db.select().from(s.categories).where(eq(s.categories.slug, catSlug));
check("cleanup: no leftover category rows", leftoverCats.length === 0);

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
