import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/session";
import {
  mockVendorRepo,
  listListingsByVendor,
  canVendorBePublic,
  mockReviewRepo,
} from "@voeq/data";
import { VendorDashboardClient } from "@/components/vendor/VendorDashboardClient";
import { ListingCreateForm } from "@/components/vendor/ListingCreateForm";

/**
 * VS3.4 / VS5 — Vendor dashboard (single-scroll, one-identity).
 * Shopper capabilities (saved / following / notifications) stay at the TOP;
 * vendor builder capabilities are BELOW, in the stateful VendorDashboardClient
 * which owns live-preview draft state (VS5.4).
 */
export default async function VendorDashboardPage() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/login");
  if (!identity.vendorId) redirect("/onboarding/vendor");

  const vendor = await mockVendorRepo.getById(identity.vendorId);
  if (!vendor) redirect("/onboarding/vendor");

  const listings = listListingsByVendor(vendor.id).map((l) => ({
    ...l,
    vendorName: vendor.name,
    rating: undefined,
    verified: (l as { verified?: boolean }).verified,
    categorySlug: l.categoryId,
    image: l.images?.[0],
  }));
  const live = canVendorBePublic(vendor);
  const reviews = await mockReviewRepo.listByVendor(vendor.id);
  const ratingCount = reviews.length;
  const ratingAvg =
    ratingCount > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / ratingCount) * 10) / 10 : 0;
  const verifiedCount = listings.filter((l) => (l as { verified?: boolean }).verified).length;

  return (
    <main data-testid="vendor-dashboard" style={{ minHeight: "100vh", background: "var(--role-bg)", padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h2)" }}>{vendor.name}</h1>
      <p data-testid="vendor-status" style={{ color: "var(--role-muted)" }}>
        Status: {live ? "Public" : "Account ready — not yet public"}
      </p>

      {vendor.status === "suspended" && (
        <div data-testid="vendor-suspended-banner" role="alert" style={{ background: "var(--role-danger-soft, #fdecea)", color: "var(--role-danger)", border: "1px solid var(--role-danger)", borderRadius: "var(--radius)", padding: "var(--space-2) var(--space-3)", marginBottom: "var(--space-3)" }}>
          Your storefront is suspended by staff. You can browse, but editing listings and messaging are disabled. Contact support for details.
        </div>
      )}

      <ol className="wizard-steps" aria-label="Phase B progress" data-testid="phase-b-steps">
        <li className={vendor.profilePhotoUrl ? "is-active" : ""} data-testid="step-photo">
          1. Profile photo {vendor.profilePhotoUrl ? "✓" : ""}
        </li>
        <li className={listings.length > 0 ? "is-active" : ""} data-testid="step-listing">
          2. First listing {listings.length > 0 ? `✓ (${listings.length})` : ""}
        </li>
        <li className={live ? "is-active" : ""} data-testid="step-live">
          3. Go live {live ? "✓" : ""}
        </li>
      </ol>

      <div data-testid="can-go-live" style={{ marginTop: "var(--space-2)" }}>
        {live ? (
          <p style={{ color: "var(--color-accent-gold)" }}>Your storefront is live. 🎉</p>
        ) : (
          <p style={{ color: "var(--role-muted)" }}>
            Complete the photo and first listing to go public.
          </p>
        )}
      </div>

      <hr style={{ border: 0, borderTop: "1px solid var(--role-border)", margin: "var(--space-4) 0" }} />

      <VendorDashboardClient
        vendor={vendor}
        listings={listings}
        ratingAvg={ratingAvg}
        ratingCount={ratingCount}
        verifiedCount={verifiedCount}
        reviews={reviews}
        disabled={vendor.status === "suspended"}
      />
    </main>
  );
}
