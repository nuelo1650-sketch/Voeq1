/**
 * EXTRA DEMO SEED (2026-09-01) — more vendors across campuses so Explore feels
 * alive (user: "people should want to stay"). SAME honesty rules as seed-demo:
 * real rows, "Demo:" prefix, zero fabricated engagement. Images REUSE the
 * verified Cloudinary demo images that we confirmed load (HTTP 200) — never
 * picsum.photos (unreliable host, was the earlier broken-image root cause).
 * Delete via POST /api/staff/admin-cleanup { op:"delete-vendor", vendorId }.
 */
import { getDb } from "../src/client";
import * as s from "../src/schema";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { eq } from "drizzle-orm";

// Load DATABASE_URL from apps/web/.env.local (same as the audit scripts).
if (!process.env.DATABASE_URL) {
  const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
  const m = /^DATABASE_URL=(.+)$/m.exec(env);
  if (m?.[1]) process.env.DATABASE_URL = m[1].trim();
}
const db = getDb();
const NOW = new Date().toISOString();

const CLOUD = "https://res.cloudinary.com/jq9gwigz/image/upload/v1788151594/voeq-demo";
// Known-good images that already load (verified HTTP 200 earlier).
const IMGS = {
  jollof: `${CLOUD}/jollof-bowl.jpg`,
  grilledFish: `${CLOUD}/grilled-fish.jpg`,
  partyJollof: `${CLOUD}/party-jollof.jpg`,
  boxBraids: `${CLOUD}/box-braids.jpg`,
  wigInstall: `${CLOUD}/wig-install.jpg`,
  phoneRepair: `${CLOUD}/phone-repair.jpg`,
  laptopClean: `${CLOUD}/laptop-clean.jpg`,
} as const;

type ExtraVendorSpec = {
  name: string;
  slug: string;
  campus: string;
  categoryId: string;
  categorySlug: string;
  description: string;
  listings: { title: string; priceNaira: number; img: string; description: string }[];
};

const SPECS: ExtraVendorSpec[] = [
  {
    name: "Demo: Campus Threads",
    slug: "demo-campus-threads",
    campus: "unilag",
    categoryId: "fashion",
    categorySlug: "fashion",
    description: "Demo vendor — affordable fits, thrifted and brand-new, for campus life. (Delete via admin when done reviewing.)",
    listings: [
      { title: "Vintage Denim Jacket", priceNaira: 8500, img: IMGS.jollof, description: "Classic washed denim, small-medium." },
      { title: "Streetwear Hoodie", priceNaira: 7500, img: IMGS.boxBraids, description: "Heavy cotton, unisex, multiple sizes." },
    ],
  },
  {
    name: "Demo: Kiki Beauty Bar",
    slug: "demo-kiki-beauty-bar",
    campus: "unilag",
    categoryId: "beauty",
    categorySlug: "beauty-care",
    description: "Demo vendor — lashes, brows and beauty for that campus glow. (Delete via admin when done reviewing.)",
    listings: [
      { title: "Lash Extension Set", priceNaira: 6500, img: IMGS.wigInstall, description: "Classic lash set, natural curl." },
      { title: "Gel Manicure", priceNaira: 4000, img: IMGS.grillFish, description: "Colour of choice, chip-resistant top coat." },
    ],
  },
  {
    name: "Demo: Byte Shop",
    slug: "demo-byte-shop",
    campus: "unilag",
    categoryId: "electronics",
    categorySlug: "electronics",
    description: "Demo vendor — accessories, cables and gadget essentials at campus prices. (Delete via admin when done reviewing.)",
    listings: [
      { title: "USB-C Fast Charger", priceNaira: 3500, img: IMGS.phoneRepair, description: "20W fast charger, cable included." },
      { title: "Phone Case Bundle", priceNaira: 3000, img: IMGS.laptopClean, description: "Clear + silicone case, free screen guard." },
    ],
  },
];

async function main() {
  let vendorCount = 0;
  let listingCount = 0;
  for (const spec of SPECS) {
    const existing = await db.select().from(s.vendors).where(eq(s.vendors.slug, spec.slug)).limit(1);
    if (existing.length) {
      console.log(`[demo-extra] already present: ${spec.slug}`);
      continue;
    }
    const vendorId = randomUUID();
    const identityId = randomUUID();
    const email = `${spec.slug}@demo.voeq.ng`;
    await db.insert(s.identities).values({
      id: identityId, email, name: spec.name, method: "email", role: "vendor", intent: "vendor",
      // Semantic fix (2026-09-04, persona-link investigation): a demo identity is
      // a full vendor persona — set vendorId here too. The old seed wrote the
      // vendors.identity_id backlink but left identities.vendor_id NULL, so the
      // owner could never reach /vendor/dashboard (role says vendor, vendorId
      // null -> every route bounces them to onboarding). Both directions now.
      vendorId,
      accountStatus: "active", emailVerified: true, campus: spec.campus,
      // Consent accepted at seed time (current terms) so demo identities never
      // hit the consent wall on login.
      consent: [{ termsVersion: "2026-08-01", privacyVersion: "2026-08-01", acceptedAt: NOW, method: "email" }],
      createdAt: NOW, updatedAt: NOW,
    });
    await db.insert(s.vendors).values({
      id: vendorId, identityId, name: spec.name,
      handle: spec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      slug: spec.slug, campus: spec.campus, categoryIds: [spec.categoryId],
      status: "live", verified: true, description: spec.description,
      agreementVersion: "2026-08-01", agreementAcceptedAt: NOW,
      profilePhotoUrl: null, subArea: null,
    });
    for (const l of spec.listings) {
      await db.insert(s.listings).values({
        id: randomUUID(), vendorId, title: l.title,
        priceMinor: l.priceNaira * 100, priceMinMinor: l.priceNaira * 100,
        isPublished: true, images: [l.img], categoryId: spec.categoryId,
        description: l.description, status: "active", isFeatured: false,
      });
      listingCount++;
    }
    vendorCount++;
    console.log(`[demo-extra] seeded: ${spec.slug} (${spec.listings.length} listings)`);
  }
  console.log(`[demo-extra] done: vendors=${vendorCount} listings=${listingCount}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
