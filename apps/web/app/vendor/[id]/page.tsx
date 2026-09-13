import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadVendorStorefront, canVendorBePublic, loadExplore, CATEGORY_ID_TO_SLUG } from "@voeq/data";
import { getStaffIdentity } from "@/lib/session";
import { StorefrontHero } from "@/components/storefront/StorefrontHero";
import { StorefrontGrid } from "@/components/storefront/StorefrontGrid";
import { StorefrontTrust } from "@/components/storefront/StorefrontTrust";
import { StorefrontRecommendations } from "@/components/storefront/StorefrontRecommendations";
import { ShareButtons } from "@/components/share/ShareButtons";

/**
 * Vendor Storefront — PG-PUB-004 (Doc 04). K2.5 enhanced with recommendation rows.
 * The vendor's world: editorial hero, listings grid, trust section, and recommendation
 * rows ("Explore more listings" + "Related vendors").
 *
 * VS3.5: visibility is DERIVED (no stored isPublic flag). A vendor is only
 * publicly visible when canVendorBePublic() is true (Phase A + Phase B complete).
 * Unknown id OR not-yet-public => 404, never a 500.
 */

interface StorefrontPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: StorefrontPageProps): Promise<Metadata> {
  const { id } = await params;
  const vendor = await loadVendorStorefront(id);
  // STAFF VIEW (2026-09-07): non-public storefronts are viewable by staff —
  // but must NEVER be indexed (a pending vendor's page in Google would be a
  // dead link for everyone else and leak moderation state). Request-scoped
  // check — no module-level caching (sessions must never leak across requests).
  const staff = await getStaffIdentity().catch(() => null);
  if (vendor && !canVendorBePublic(vendor) && staff) {
    return { title: `${vendor.name} — Staff preview`, robots: { index: false, follow: false } };
  }
  // SOFT-200 FIX (2026-09-05): unknown/non-public vendor answered HTTP 200 on
  // prod (verified). Root cause: the ROOT app/loading.tsx Suspense boundary
  // flushed a 200 shell before notFound() could abort (same disease as round
  // 57 A1, documented in middleware.ts). Boundary removed → real 404.
  if (!vendor || !canVendorBePublic(vendor)) {
    notFound();
  }
  
  const title = `${vendor.name} — Voeq Storefront`;
  const description = vendor.description 
    ? vendor.description.slice(0, 160)
    : `Discover ${vendor.name} on Voeq — student-vouched listings at ${vendor.campus}.`;
  const image = vendor.profilePhotoUrl || '/og-default.png';
  const url = `https://voeq.ng/vendor/${vendor.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: vendor.name }],
      url,
      type: 'website',
      siteName: 'Voeq',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { id } = await params;
  const vendor = await loadVendorStorefront(id);
  // STAFF VIEW (2026-09-07, founder: "in the admin I should be able to click
  // buttons that redirect me to their listings… view and go directly to where
  // a listing is"): staff reviewing a verification/moderation case hit a 404
  // here because canVendorBePublic() is status==='live' and queue vendors are
  // usually pending. A signed-in STAFF identity may view any vendor's
  // storefront, with a staff-only banner (noindex keeps it out of search).
  const staff = await getStaffIdentity();
  const staffView = Boolean(staff) && !vendor?.status?.includes("suspended");
  // Only public storefronts OR staff views render; everyone else gets 404.
  if (!vendor || (!canVendorBePublic(vendor) && !staffView)) notFound();
  const isStaffView = !canVendorBePublic(vendor) && staffView;

  // Load recommendations (K2.5 #2, #3)
  const exploreRes = await loadExplore({ query: "", campus: vendor.campus });
  const otherListings = exploreRes.data
    .filter((l) => l.vendorId !== vendor.id)
    .slice(0, 8);
  
  // P-A round 33 (FIND-05 fix): vendor.categoryIds holds category IDS ("food"),
  // but loadExplore filters by categorySlug ("food-drinks") — passing the id
  // made "Similar vendors" ALWAYS empty. Map id -> slug before filtering.
  const similarCategorySlug = vendor.categoryIds.length > 0
    ? (CATEGORY_ID_TO_SLUG[vendor.categoryIds[0]] ?? vendor.categoryIds[0])
    : undefined;
  const relatedVendors = similarCategorySlug
    ? await loadExplore({ category: similarCategorySlug, campus: vendor.campus }).then((res) =>
        res.data.filter((l) => l.vendorId !== vendor.id).slice(0, 8)
      )
    : [];

  return (
    <main data-env="cream" data-testid="storefront-page" style={{ minHeight: "100vh", background: "var(--role-bg)", padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)" }}>
      {/* STAFF-VIEW banner (staff only, never shown to the public): this
          storefront is not live yet — staff see it for review with direct
          links to the moderation case. */}
      {isStaffView && (
        <div data-testid="staff-view-banner" style={{ maxWidth: 1100, margin: "0 auto var(--space-3)", padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(232,163,61,.4)", background: "rgba(232,163,61,.12)", fontFamily: "var(--role-font-ui)", fontSize: 13, color: "var(--color-forest)" }}>
          <strong>Staff preview</strong> — this storefront is <strong>{vendor.status}</strong> (not public). Students cannot see this page yet.{" "}
          <Link href={`/staff/moderation?tab=verifications`} style={{ color: "var(--color-forest-mid, #2d5a3d)", fontWeight: 650, textDecoration: "none" }}>Open verification queue →</Link>
        </div>
      )}
      <StorefrontHero vendor={vendor} />
      <StorefrontGrid listings={vendor.listings} />
      <StorefrontTrust vendor={vendor} />
      <StorefrontRecommendations 
        otherListings={otherListings}
        relatedVendors={relatedVendors}
        vendorName={vendor.name}
      />
      {/* S1: share folds into a slim bar (was a lonely full section with its
          own heading at the very bottom). */}
      <section data-testid="storefront-share-bar" className="vs-sharebar" aria-label="Share this store">
        <span>Share this store</span>
        <ShareButtons vendorId={vendor.id} compact />
      </section>
    </main>
  );
}
