/**
 * One-off account seeder — writes REAL rows to Neon via @voeq/data repos.
 * Run:  tsx apps/web/scripts/seed-accounts.ts   (env loaded from repo root .env.local)
 *
 * Creates:
 *   - 1 vendor  (identity + vendor record + 1 listing)  on campus "nmu"
 *   - 1 shopper (identity, active, consent accepted)
 * Confirms the super_admin (VOEQ_SUPER_ADMIN_EMAIL) is bootstrapped.
 * Idempotent: re-running reuses existing rows by email.
 */
import {
  mockIdentityRepo,
  mockVendorRepo,
  mockListingsRepo,
  mockConsentRepo,
  bootstrapSuperAdmin,
} from "@voeq/data";
import { hash } from "@node-rs/argon2";

const PW = "VoeqSeed!2026"; // shown to operator; rotate after first login
const VENDOR_EMAIL = "seed.vendor@voeq.ng";
const SHOPPER_EMAIL = "seed.shopper@voeq.ng";

async function upsertVendor() {
  let id = await mockIdentityRepo.getByEmail(VENDOR_EMAIL);
  if (!id) {
    id = await mockIdentityRepo.createPending({
      email: VENDOR_EMAIL,
      name: "Campus Eats (Seed)",
      passwordHash: await hash(PW),
      method: "email",
      intent: "vendor",
    });
  }
  id =
    (await mockIdentityRepo.patch(id.id, {
      accountStatus: "active",
      emailVerified: true,
      campus: "nmu",
      role: "vendor",
      intent: "vendor",
    })) ?? id;

  if (!(await mockConsentRepo.isCurrent(id.id))) {
    await mockConsentRepo.accept(id.id, "email");
  }

  let vendor = await mockVendorRepo.getByIdentityId(id.id);
  if (!vendor) {
    vendor = await mockVendorRepo.create({
      identityId: id.id,
      name: "Campus Eats",
      campus: "nmu",
      categoryIds: ["food"],
      description: "Affordable meals and snacks for students.",
      profilePhotoUrl: null,
    });
  }

  const all = (await mockListingsRepo.list({} as never)) as unknown[];
  const existing = (all as Array<{ vendorId: string }>).filter((l) => l.vendorId === vendor.id);
  if (existing.length === 0) {
    await mockListingsRepo.create({
      vendorId: vendor.id,
      title: "Jollof Rice & Chicken",
      priceMinMinor: 2500, // R25.00
      categoryId: "food",
      description: "Freshly cooked jollof with grilled chicken.",
      campus: "nmu",
    } as never);
  }
  return { identityId: id.id, vendorId: vendor.id };
}

async function upsertShopper() {
  let id = await mockIdentityRepo.getByEmail(SHOPPER_EMAIL);
  if (!id) {
    id = await mockIdentityRepo.createPending({
      email: SHOPPER_EMAIL,
      name: "Seed Shopper",
      passwordHash: await hash(PW),
      method: "email",
      intent: "shopper",
    });
  }
  id =
    (await mockIdentityRepo.patch(id.id, {
      accountStatus: "active",
      emailVerified: true,
      campus: "nmu",
      role: "shopper",
      intent: "shopper",
    })) ?? id;
  if (!(await mockConsentRepo.isCurrent(id.id))) {
    await mockConsentRepo.accept(id.id, "email");
  }
  return { identityId: id.id };
}

async function main() {
  const sa = await bootstrapSuperAdmin();
  const vendor = await upsertVendor();
  const shopper = await upsertShopper();
  console.log(JSON.stringify({ superAdmin: sa, vendor, shopper, password: PW }, null, 2));
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error("SEED FAILED:", e);
    process.exit(1);
  },
);
