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
  { id: "lasu", name: "Lagos State University", slug: "lasu", region: "Lagos State", city: "Ojo", state: "Lagos State", lat: 6.5075, lng: 3.2065, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "yabatech", name: "Yaba College of Technology", slug: "yabatech", region: "Lagos State", city: "Yaba", state: "Lagos State", lat: 6.5156, lng: 3.3571, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "lasustech", name: "Lagos State University of Science & Tech", slug: "lasustech", region: "Lagos State", city: "Ikorodu", state: "Lagos State", lat: 6.6570, lng: 3.5090, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "futa", name: "Federal University of Technology Akure", slug: "futa", region: "Ondo State", city: "Akure", state: "Ondo State", lat: 7.2991, lng: 5.1355, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "aaua", name: "Adekunle Ajasin University", slug: "aaua", region: "Ondo State", city: "Akungba-Akoko", state: "Ondo State", lat: 7.4900, lng: 5.7400, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "unilorin", name: "University of Ilorin", slug: "unilorin", region: "Kwara State", city: "Ilorin", state: "Kwara State", lat: 8.4825, lng: 4.5451, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "buk", name: "Bayero University Kano", slug: "buk", region: "Kano State", city: "Kano", state: "Kano State", lat: 11.9722, lng: 8.5215, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "unizik", name: "Nnamdi Azikiwe University", slug: "unizik", region: "Anambra State", city: "Awka", state: "Anambra State", lat: 6.2325, lng: 7.0850, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "imsu", name: "Imo State University", slug: "imsu", region: "Imo State", city: "Owerri", state: "Imo State", lat: 5.4849, lng: 7.0345, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "rsu", name: "Rivers State University", slug: "rsu", region: "Rivers State", city: "Port Harcourt", state: "Rivers State", lat: 4.8958, lng: 6.9667, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "delsu", name: "Delta State University", slug: "delsu", region: "Delta State", city: "Abraka", state: "Delta State", lat: 5.7902, lng: 6.1000, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "aau", name: "Ambrose Alli University", slug: "aau", region: "Edo State", city: "Ekpoma", state: "Edo State", lat: 6.7443, lng: 6.1265, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "uniuyo", name: "University of Uyo", slug: "uniuyo", region: "Akwa Ibom State", city: "Uyo", state: "Akwa Ibom State", lat: 5.0342, lng: 7.9075, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "absu", name: "Abia State University", slug: "absu", region: "Abia State", city: "Uturu", state: "Abia State", lat: 5.8400, lng: 7.4700, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "oou", name: "Olabisi Onabanjo University", slug: "oou", region: "Ogun State", city: "Ago-Iwoye", state: "Ogun State", lat: 6.9417, lng: 3.9444, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "futminna", name: "Federal University of Technology Minna", slug: "futminna", region: "Niger State", city: "Minna", state: "Niger State", lat: 9.5437, lng: 6.5300, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "kasu", name: "Kaduna State University", slug: "kasu", region: "Kaduna State", city: "Kaduna", state: "Kaduna State", lat: 10.5222, lng: 7.4384, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "esut", name: "Enugu State University of Science & Tech", slug: "esut", region: "Enugu State", city: "Agbani", state: "Enugu State", lat: 6.3200, lng: 7.5100, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "unical", name: "University of Calabar", slug: "unical", region: "Cross River State", city: "Calabar", state: "Cross River State", lat: 4.9575, lng: 8.3277, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "unimaid", name: "University of Maiduguri", slug: "unimaid", region: "Borno State", city: "Maiduguri", state: "Borno State", lat: 11.8447, lng: 13.1525, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "babcock", name: "Babcock University", slug: "babcock", region: "Ogun State", city: "Ilishan-Remo", state: "Ogun State", lat: 6.8912, lng: 3.7226, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "uniport", name: "University of Port Harcourt", slug: "uniport", region: "Rivers State", city: "Port Harcourt", state: "Rivers State", lat: 4.8958, lng: 6.9426, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "bingham", name: "Bingham University", slug: "bingham", region: "Nasarawa State", city: "Karu", state: "Nasarawa State", lat: 9.2967, lng: 7.5900, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "landmark", name: "Landmark University", slug: "landmark", region: "Kwara State", city: "Omu-Aran", state: "Kwara State", lat: 8.1399, lng: 5.0950, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
  { id: "kogist", name: "Kogi State University", slug: "kogist", region: "Kogi State", city: "Anyigba", state: "Kogi State", lat: 7.4000, lng: 6.7333, source: "seeded" as const, status: "verified" as const, createdAt: new Date(0).toISOString() },
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
