/**
 * DEMO SEED (2026-08-31) — user-requested demo vendors so the redesign is visible.
 *
 * HONEST DATA ONLY: these create REAL rows through the real repos (Neon), with
 * real id/status/timestamps. They are clearly demo (name prefix "Demo:").
 * Zero fabricated reviews/likes/follows — engagement stays honest (empty).
 * Images use picsum.photos seeded URLs (deterministic, real images).
 *
 * DELETE LATER (user asked for admin cleanup so they don't need a dev):
 *   POST /api/staff/admin-cleanup { op:"delete-vendor", vendorId } — or
 *   POST /api/staff/admin-cleanup { op:"delete-identity", identityId }.
 */
import { getDb } from "../src/client";
import * as s from "../src/schema";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

const db = getDb();
const NOW = new Date().toISOString();

type DemoVendorSpec = {
  name: string;
  slug: string;
  campus: string;
  categoryId: string;
  categorySlug: string;
  description: string;
  listings: { title: string; priceNaira: number; img: number; description: string }[];
};

// Realistic campus marketplace mix, honest demo data, no fake stats.
const SPECS: DemoVendorSpec[] = [
  {
    name: "Demo: Mama Nkechi Kitchen",
    slug: "demo-mama-nkechi-kitchen",
    campus: "nmu-okerenkoko",
    categoryId: "food",
    categorySlug: "food-drinks",
    description: "Demo vendor — home-style Nigerian meals on campus, made to order. (Delete via admin when done reviewing.)",
    listings: [
      { title: "Jollof & Plantain Bowl", priceNaira: 6500, img: 1, description: "Smoky party jollof with fried plantain and grilled chicken." },
      { title: "Grilled Fish Platter", priceNaira: 9500, img: 2, description: "Fresh tilapia grilled with peppers and sides." },
      { title: "Party Jollof Catering (per tray)", priceNaira: 45000, img: 3, description: "Event catering — serves 10-12 people per tray." },
    ],
  },
  {
    name: "Demo: Glam by Zee",
    slug: "demo-glam-by-zee",
    campus: "nmu-okerenkoko",
    categoryId: "beauty",
    categorySlug: "beauty-care",
    description: "Demo vendor — braids, wigs and styling for campus events. (Delete via admin when done reviewing.)",
    listings: [
      { title: "Box Braids with Extensions", priceNaira: 12000, img: 4, description: "Knotless box braids, waist length, any colour." },
      { title: "Wig Installation + Styling", priceNaira: 8500, img: 5, description: "Frontal/closure install with styling." },
    ],
  },
  {
    name: "Demo: FixIT Campus",
    slug: "demo-fixit-campus",
    campus: "nmu-okerenkoko",
    categoryId: "services",
    categorySlug: "photo-printing",
    description: "Demo vendor — phone, laptop and gadget repair on campus. (Delete via admin when done reviewing.)",
    listings: [
      { title: "Phone Screen Repair", priceNaira: 11000, img: 6, description: "iPhone/Samsung screen replacement, same-day." },
      { title: "Laptop Clean + Repaste", priceNaira: 7000, img: 7, description: "Full internal clean, thermal paste renewal." },
    ],
  },
];

export async function seedDemoVendors() {
  let vendorCount = 0;
  let listingCount = 0;

  for (const spec of SPECS) {
    // Skip if this demo vendor already exists (idempotent).
    const existing = await db.select().from(s.vendors).where(eq(s.vendors.slug, spec.slug)).limit(1);
    if (existing.length) {
      console.log(`[demo] already present: ${spec.slug}`);
      continue;
    }

    const vendorId = randomUUID();
    const identityId = randomUUID();
    // Real identity so the vendor has an account (their email/password are
    // known only to the operator; harmless demo data).
    const email = `${spec.slug}@demo.voeq.ng`;
    await db.insert(s.identities).values({
      id: identityId,
      email,
      name: spec.name,
      method: "email",
      role: "vendor",
      intent: "vendor",
      accountStatus: "active",
      emailVerified: true,
      campus: spec.campus,
      consent: [],
      createdAt: NOW,
      updatedAt: NOW,
    });
    await db.insert(s.vendors).values({
      id: vendorId,
      identityId,
      name: spec.name,
      handle: spec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      slug: spec.slug,
      campus: spec.campus,
      categoryIds: [spec.categoryId],
      status: "live",
      verified: true,
      description: spec.description,
      agreementVersion: "2026-08-01",
      agreementAcceptedAt: NOW,
      profilePhotoUrl: null,
      subArea: null,
    });

    for (const l of spec.listings) {
      const listingId = randomUUID();
      await db.insert(s.listings).values({
        id: listingId,
        vendorId,
        title: l.title,
        priceMinor: l.priceNaira * 100,
        priceMinMinor: l.priceNaira * 100,
        isPublished: true,
        images: [`https://picsum.photos/seed/voeq${l.img}-${l.img * 7}/640/480`],
        categoryId: spec.categoryId,
        description: l.description,
        status: "active",
        isFeatured: false,
      });
      listingCount++;
    }
    vendorCount++;
    console.log(`[demo] seeded: ${spec.slug} (${spec.listings.length} listings)`);
  }

  console.log(`[demo] done: vendors=${vendorCount} listings=${listingCount}`);
  return { vendorCount, listingCount };
}

// Self-execute so we can `tsx src/seed-demo.ts` directly.
const isMain = process.argv[1]?.endsWith("seed-demo.mts") || process.argv[1]?.endsWith("seed-demo.ts");
if (isMain) {
  seedDemoVendors().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
