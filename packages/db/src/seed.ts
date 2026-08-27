/**
 * D.2 — Idempotent seed for a fresh Neon DB.
 * Seeds 10 campuses, 5 categories, 6 vendors, 25 listings, 1 super-admin.
 * Safe to run repeatedly: each insert is keyed/idempotent.
 *
 * Run: `npm run db:seed` (sets DATABASE_URL first), or auto-runs on boot when
 * the DB is empty (see packages/data/src/real.ts -> ensureSeeded()).
 */
import { getDb } from "./client";
import * as s from "./schema";
import { realVendorRepo, realListingsRepo, realIdentityRepo, realSessionRepo } from "./repos";

const CAMPUSSES = [
  { id: "nmu-okerenkoko", name: "Nigeria Maritime University (Okerenkoko)", slug: "nmu-okerenkoko", region: "Delta State", city: "Okerenkoko", state: "Delta State", lat: 5.62449, lng: 5.39038, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "nmu-kurutie", name: "Nigeria Maritime University (Kurutie)", slug: "nmu-kurutie", region: "Delta State", city: "Kurutie", state: "Delta State", lat: 5.62449, lng: 5.39038, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "unilag", name: "University of Lagos", slug: "unilag", region: "Lagos State", city: "Lagos", state: "Lagos State", lat: 6.51667, lng: 3.38611, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "ui", name: "University of Ibadan", slug: "ui", region: "Oyo State", city: "Ibadan", state: "Oyo State", lat: 7.3912, lng: 3.9167, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "oau", name: "Obafemi Awolowo University", slug: "oau", region: "Osun State", city: "Ile-Ife", state: "Osun State", lat: 7.51833, lng: 4.52278, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "unn", name: "University of Nigeria Nsukka", slug: "unn", region: "Enugu State", city: "Nsukka", state: "Enugu State", lat: 6.858, lng: 7.396, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "covenant", name: "Covenant University", slug: "covenant", region: "Ogun State", city: "Ota", state: "Ogun State", lat: 6.6699, lng: 3.1574, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "futo", name: "Federal University of Technology Owerri", slug: "futo", region: "Imo State", city: "Owerri", state: "Imo State", lat: 5.384, lng: 6.995, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "uniben", name: "University of Benin", slug: "uniben", region: "Edo State", city: "Benin City", state: "Edo State", lat: 6.33370, lng: 5.60015, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "abu", name: "Ahmadu Bello University", slug: "abu", region: "Kaduna State", city: "Zaria", state: "Kaduna State", lat: 11.067, lng: 7.700, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "unijos", name: "University of Jos", slug: "unijos", region: "Plateau State", city: "Jos", state: "Plateau State", lat: 9.95028, lng: 8.88917, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
];

const CATEGORIES = [
  { id: "food", name: "Food", slug: "food" },
  { id: "tech", name: "Tech", slug: "tech" },
  { id: "books", name: "Books", slug: "books" },
  { id: "services", name: "Services", slug: "services" },
  { id: "fashion", name: "Fashion", slug: "fashion" },
];

export async function seed(): Promise<void> {
  const db = getDb();
  await db.insert(s.campuses).values(CAMPUSSES).onConflictDoNothing();
  await db.insert(s.categories).values(CATEGORIES).onConflictDoNothing();

  const superEmail = process.env.SUPER_ADMIN_EMAIL ?? process.env.VOEQ_SUPER_ADMIN_EMAIL ?? "admin@voeq.ng";
  if (!(await realIdentityRepo.getByEmail(superEmail))) {
    await realIdentityRepo.createPending({
      email: superEmail,
      name: "Voeq Admin",
      passwordHash: null,
      method: "email",
      intent: "vendor",
    });
    const idRow = await realIdentityRepo.getByEmail(superEmail);
    if (idRow) {
      await realIdentityRepo.patch(idRow.id, { accountStatus: "active", staffRole: "super_admin", emailVerified: true });
    }
  }

  // 6 demo vendors across campuses/categories.
  const vendors = [
    { name: "Campus Eats", campus: "nmu-okerenkoko", categoryIds: ["food"], slug: "campus-eats" },
    { name: "Tech Swap", campus: "unilag", categoryIds: ["tech"], slug: "tech-swap" },
    { name: "Book Nook", campus: "ui", categoryIds: ["books"], slug: "book-nook" },
    { name: "Quick Fix", campus: "oau", categoryIds: ["services"], slug: "quick-fix" },
    { name: "Thread Theory", campus: "unn", categoryIds: ["fashion"], slug: "thread-theory" },
    { name: "NMU Prints", campus: "nmu-okerenkoko", categoryIds: ["tech", "services"], slug: "nmu-prints" },
  ];
  for (const v of vendors) {
    if (!(await realVendorRepo.listVendors({ campus: v.campus })).some((x) => x.slug === v.slug)) {
      await realVendorRepo.create({
        identityId: "seed",
        name: v.name,
        campus: v.campus,
        categoryIds: v.categoryIds,
        slug: v.slug,
        status: "live",
        verified: true,
        description: `${v.name} — demo vendor on Voeq.`,
        agreementVersion: "2026-08-01",
        agreementAcceptedAt: new Date().toISOString(),
      });
    }
  }

  // 25 listings spread across the 6 vendors.
  const allVendors = await realVendorRepo.listVendors();
  let created = 0;
  for (let i = 0; i < 25 && created < 25; i++) {
    const v = allVendors[i % allVendors.length];
    if (!v) continue;
    await realListingsRepo.create({
      vendorId: v.id,
      title: `Demo listing ${i + 1}`,
      priceMinMinor: 1000 * (i + 1),
      categoryId: v.categoryIds[0] ?? "food",
      description: "Seeded demo listing.",
      images: [],
      status: "active",
      isFeatured: i % 5 === 0, // a few featured -> surfaced as trending
    });
    created++;
  }

  // eslint-disable-next-line no-console
  console.log(`[seed] done: ${CAMPUSSES.length} campuses, ${CATEGORIES.length} categories, ${allVendors.length} vendors, ${created} listings.`);
}

// Run only when invoked directly (e.g. `npx tsx src/seed.ts`), NOT when imported
// as a library (e.g. by vitest via @voeq/db). Never call process.exit here — that
// would kill any host process that imports this module.
const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  /seed\.(ts|js)$/.test(process.argv[1].replace(/\\/g, "/"));

if (isMain) {
  seed()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log("[seed] complete");
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error("[seed] FAILED:", e);
      process.exitCode = 1;
    });
}
