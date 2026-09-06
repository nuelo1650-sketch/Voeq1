import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/session";
import { loadVendorStorefront, canVendorBePublic, loadExplore } from "@voeq/data";
import { StorefrontHero } from "@/components/storefront/StorefrontHero";
import { StorefrontGrid } from "@/components/storefront/StorefrontGrid";
import { StorefrontTrust } from "@/components/storefront/StorefrontTrust";
import { StorefrontRecommendations } from "@/components/storefront/StorefrontRecommendations";
import { CATEGORY_ID_TO_SLUG } from "@voeq/data/explore-view";

export const dynamic = "force-dynamic";

/**
 * L2 (2026-09-06) — Vendor PREVIEW MODE.
 *
 * The architecture gap: vendors had NO way to see their storefront as
 * shoppers see it — the vendor shell locks navigation to vendor surfaces,
 * and the public storefront carried no preview context. Vendors "previewed"
 * by navigating to their own public URL blind.
 *
 * This route renders the REAL public storefront (same components, same data
 * path — zero mocks) with ONE addition: a slim banner that says what this
 * is, offers the edit shortcuts (preview doubles as the edit-loop entry),
 * and exits back to the vendor dashboard. Auth = session vendor viewing
 * their OWN store only (owner-scoped).
 */
export default async function VendorPreviewPage() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/login?next=/vendor/preview");
  if (!identity.vendorId) redirect("/onboarding/vendor");

  const vendor = await loadVendorStorefront(identity.vendorId);
  if (!vendor) notFound();

  // Preview still uses the public data path — but a pending vendor's own
  // preview must work BEFORE go-live (that's the whole point of previewing),
  // so only the visibility precondition is relaxed for the owner.
  const publicOk = canVendorBePublic(vendor);
  if (!publicOk && vendor.id !== identity.vendorId) notFound();

  // Same recommendations the public page loads.
  const exploreRes = await loadExplore({ query: "", campus: vendor.campus });
  const otherListings = exploreRes.data.filter((l) => l.vendorId !== vendor.id).slice(0, 8);
  const similarCategorySlug = vendor.categoryIds.length > 0
    ? (CATEGORY_ID_TO_SLUG[vendor.categoryIds[0]] ?? vendor.categoryIds[0])
    : undefined;
  const relatedVendors = similarCategorySlug
    ? await loadExplore({ category: similarCategorySlug, campus: vendor.campus }).then((res) =>
        res.data.filter((l) => l.vendorId !== vendor.id).slice(0, 8),
      )
    : [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--role-bg)" }}>
      {/* PREVIEW BANNER — the ONLY added chrome; everything below is the
          genuine public render. */}
      <div
        data-testid="preview-banner"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          padding: "10px var(--nav-inline-pad)",
          background: "var(--color-forest)",
          color: "var(--color-cream)",
          fontFamily: "var(--role-font-ui)",
          fontSize: 13.5,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
          👁 Preview — this is exactly how shoppers see your store
          {!publicOk && (
            <span
              data-testid="preview-not-live-note"
              style={{ background: "rgba(232,163,61,.25)", color: "var(--color-amber)", padding: "2px 8px", borderRadius: 999, fontSize: 11.5, fontWeight: 650 }}
            >
              Not live yet — go-live pending
            </span>
          )}
        </span>
        <span style={{ display: "inline-flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/vendor/storefront"
            data-testid="preview-edit-storefront"
            style={{ color: "var(--color-cream)", textDecoration: "underline", fontSize: 13 }}
          >
            Edit storefront
          </Link>
          <Link
            href="/vendor/listings"
            data-testid="preview-edit-listings"
            style={{ color: "var(--color-cream)", textDecoration: "underline", fontSize: 13 }}
          >
            Edit listings
          </Link>
          <Link
            href="/vendor/dashboard"
            data-testid="preview-exit"
            style={{
              color: "var(--color-forest)",
              background: "var(--color-cream)",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 650,
              padding: "5px 12px",
              borderRadius: 999,
            }}
          >
            Exit preview
          </Link>
        </span>
      </div>

      <main data-testid="storefront-page" style={{ minHeight: "calc(100vh - 42px)", background: "var(--role-bg)", padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)" }}>
        <StorefrontHero vendor={vendor} />
        <StorefrontGrid listings={vendor.listings} />
        <StorefrontTrust vendor={vendor} />
        <StorefrontRecommendations
          otherListings={otherListings}
          relatedVendors={relatedVendors}
          vendorName={vendor.name}
        />
      </main>
    </div>
  );
}
