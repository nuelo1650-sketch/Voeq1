import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadVendorStorefront } from "@voeq/data";
import { StorefrontHero } from "@/components/storefront/StorefrontHero";
import { StorefrontGrid } from "@/components/storefront/StorefrontGrid";
import { StorefrontTrust } from "@/components/storefront/StorefrontTrust";

/**
 * Vendor Storefront — PG-PUB-004 (Doc 04). The vendor's world: editorial hero,
 * their listings grid, and an honest reviews/trust section (graceful absence —
 * no fake reviews per founder rule). This is the ONE Deep-environment page:
 * Cream is the default world; the storefront arrives in the forest (Doc 05 A.3).
 *
 * NOTE on the Deep override: `tokens.css` flips color roles via
 * `:root[data-env="deep"]` and `layout.tsx` sets `data-env="cream"` on <html>.
 * A `data-env="deep"` on this page's <main> does NOT match the `:root[...]`
 * selector, so `globals.css` carries a scoped `[data-env="deep"]` descendant
 * override (same color values as the locked token block) to flip this subtree.
 */

interface StorefrontPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: StorefrontPageProps): Promise<Metadata> {
  const { id } = await params;
  const vendor = await loadVendorStorefront(id);
  if (!vendor) {
    return {
      title: "Storefront not found — Voeq",
      description: "This vendor storefront could not be found.",
    };
  }
  const fallbackDesc = `Discover ${vendor.name} on Voeq — student-vouched listings at ${vendor.campus}.`;
  return {
    title: `${vendor.name} — Voeq Storefront`,
    description: fallbackDesc,
  };
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { id } = await params;
  const vendor = await loadVendorStorefront(id);
  if (!vendor) notFound();

  return (
    <main data-env="deep" data-testid="storefront-page" style={{ minHeight: "100vh", background: "var(--role-bg)", padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)" }}>
      <StorefrontHero vendor={vendor} />
      <StorefrontGrid listings={vendor.listings} />
      <StorefrontTrust vendor={vendor} />
    </main>
  );
}
