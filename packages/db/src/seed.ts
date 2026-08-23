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
  { id: "nmu", name: "NMU", slug: "nmu", region: "Eastern Cape" },
  { id: "ru", name: "Rhodes University", slug: "rhodes", region: "Eastern Cape" },
  { id: "wits", name: "Wits", slug: "wits", region: "Gauteng" },
  { id: "uct", name: "UCT", slug: "uct", region: "Western Cape" },
  { id: "up", name: "UP", slug: "up", region: "Gauteng" },
  { id: "ukzn", name: "UKZN", slug: "ukzn", region: "KZN" },
  { id: "tut", name: "TUT", slug: "tut", region: "Gauteng" },
  { id: "cput", name: "CPUT", slug: "cput", region: "Western Cape" },
  { id: "uwc", name: "UWC", slug: "uwc", region: "Western Cape" },
  { id: "unisa", name: "UNISA", slug: "unisa", region: "National" },
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

  const superEmail = process.env.SUPER_ADMIN_EMAIL ?? process.env.VOEQ_SUPER_ADMIN_EMAIL ?? "admin@voeq.africa";
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
    { name: "Campus Eats", campus: "nmu", categoryIds: ["food"], slug: "campus-eats" },
    { name: "Tech Swap", campus: "wits", categoryIds: ["tech"], slug: "tech-swap" },
    { name: "Book Nook", campus: "uct", categoryIds: ["books"], slug: "book-nook" },
    { name: "Quick Fix", campus: "up", categoryIds: ["services"], slug: "quick-fix" },
    { name: "Thread Theory", campus: "ukzn", categoryIds: ["fashion"], slug: "thread-theory" },
    { name: "NMU Prints", campus: "nmu", categoryIds: ["tech", "services"], slug: "nmu-prints" },
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
