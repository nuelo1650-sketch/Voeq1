import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadVendorStorefront, canVendorBePublic, loadExplore } from "@voeq/data";
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
  if (!vendor || !canVendorBePublic(vendor)) {
    return {
      title: "Storefront not found — Voeq",
      description: "This vendor storefront could not be found.",
    };
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
  // Only render storefronts that pass the derived visibility precondition.
  if (!vendor || !canVendorBePublic(vendor)) notFound();

  // Load recommendations (K2.5 #2, #3)
  const exploreRes = await loadExplore({ query: "", campus: vendor.campus });
  const otherListings = exploreRes.data
    .filter((l) => l.vendorId !== vendor.id)
    .slice(0, 8);
  
  const relatedVendors = vendor.categoryIds.length > 0
    ? await loadExplore({ category: vendor.categoryIds[0], campus: vendor.campus }).then((res) =>
        res.data.filter((l) => l.vendorId !== vendor.id).slice(0, 8)
      )
    : [];

  return (
    <main data-env="cream" data-testid="storefront-page" style={{ minHeight: "100vh", background: "var(--role-bg)", padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)" }}>
      <StorefrontHero vendor={vendor} />
      <StorefrontGrid listings={vendor.listings} />
      <StorefrontTrust vendor={vendor} />
      <StorefrontRecommendations 
        otherListings={otherListings}
        relatedVendors={relatedVendors}
        vendorName={vendor.name}
      />
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "24px var(--nav-inline-pad)" }}>
        <h2 style={{ fontSize: "var(--fs-h3)", fontFamily: "var(--font-display)" }}>Share this store</h2>
        <ShareButtons vendorId={vendor.id} />
      </section>
    </main>
  );
}
