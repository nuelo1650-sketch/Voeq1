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
import { realVendorRepo, realIdentityRepo, realSessionRepo } from "./repos";

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

// P3 (2026-08-29): keep the DB categories table 1:1 with the canonical taxonomy
// (explore-view.ts categories) so the staff CRUD table, the vendor wizard, and
// the Explore filters all reference the same ids/slugs. id = what vendors/listings
// store; slug = URL + filter key.
const CATEGORIES = [
  { id: "food", name: "Food & Drinks", slug: "food-drinks" },
  { id: "fashion", name: "Fashion", slug: "fashion" },
  { id: "tech", name: "Tech & Repairs", slug: "tech-repairs" },
  { id: "beauty", name: "Beauty & Care", slug: "beauty-care" },
  { id: "academic", name: "Academic Services", slug: "academic-services" },
  { id: "books", name: "Books & Study Materials", slug: "books" },
  { id: "printing", name: "Printing", slug: "printing" },
  { id: "photography", name: "Photography", slug: "photography" },
  { id: "tailoring", name: "Tailoring", slug: "tailoring" },
  { id: "logistics", name: "Logistics", slug: "logistics" },
  { id: "home", name: "Home Essentials", slug: "home-essentials" },
  { id: "health", name: "Health & Wellness", slug: "health-wellness" },
  { id: "groceries", name: "Groceries", slug: "groceries" },
  { id: "tutorials", name: "Tutorials & Classes", slug: "tutorials" },
  { id: "rentals", name: "Rentals", slug: "rentals" },
  { id: "events", name: "Events & Parties", slug: "events" },
  { id: "travel", name: "Travel & Transport", slug: "travel-transport" },
  { id: "student-support", name: "Student Support", slug: "student-support" },
  { id: "other", name: "Other", slug: "other" },
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

  // P4 reset (2026-08-29): demo vendors + demo listings REMOVED from seed.
  // Founder directive: fresh platform, real vendors only, honest-empty Explore
  // until real signups. Seeded content is now: campuses, categories, super-admin.
  const allVendors = await realVendorRepo.listVendors();
  const created = 0;

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
