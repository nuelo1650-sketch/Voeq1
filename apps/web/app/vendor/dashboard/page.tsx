import { redirect } from "next/navigation";
import { requireConsent } from "@/lib/session";
import {
  mockVendorRepo,
  mockListingsRepo,
  canVendorBePublic,
  mockReviewRepo,
  mockCampusRepo,
} from "@voeq/data";
import { VendorGoLiveButton } from "@/components/vendor/VendorGoLiveButton";
import { VendorDashboardClient } from "@/components/vendor/VendorDashboardClient";
import { AppShell } from "@/components/shell/AppShell";

/**
 * VS3.4 / VS5 + K3b.1 — Vendor dashboard (single-scroll, one-identity).
 * Enhanced with modern header, attention queue indicators, and quick actions.
 */
export default async function VendorDashboardPage() {
  const identity = await requireConsent("/vendor/dashboard");
  if (!identity.vendorId) redirect("/onboarding/vendor");

  const vendor = await mockVendorRepo.getById(identity.vendorId);
  if (!vendor) redirect("/onboarding/vendor");

  const allListings = await mockListingsRepo.list();
  const listings = allListings
    .filter((l) => l.vendorId === vendor.id)
    .map((l) => ({
      ...l,
      vendorName: vendor.name,
      rating: undefined,
      // P-A round 57 (C11): `verified` was read off the LISTING — a field that
      // does not exist (verification lives on the VENDOR). Rows showed
      // "verified: $undefined" and verifiedCount was forever 0.
      verified: vendor.verified,
      categorySlug: l.categoryId,
      image: l.images?.[0],
    }));
  const live = canVendorBePublic(vendor);
  const reviews = await mockReviewRepo.listByVendor(vendor.id);
  const ratingCount = reviews.length;
  const ratingAvg =
    ratingCount > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / ratingCount) * 10) / 10 : 0;
  const verifiedCount = listings.filter((l) => (l as { verified?: boolean }).verified).length;

  const campusList = await mockCampusRepo.list(identity.id);
  const campus = campusList.find((c) => c.id === vendor.campus);
  const campusName = campus?.name || vendor.campus;

  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Status badge
  const statusBadge = vendor.status === "suspended" 
    ? { label: "Suspended", color: "var(--color-danger)" }
    : live 
    ? { label: "Live", color: "var(--color-status-live)" }
    : { label: "Pending listings", color: "var(--color-status-pending)" };

  return (
    <AppShell role="vendor" userName={vendor.name}>
      <div data-testid="vendor-dashboard" style={{ minHeight: "100vh", background: "var(--color-glass-white)", padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)" }}>
      {/* K3b.1 Header */}
      <header style={{ marginBottom: "var(--space-4)" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, margin: 0, marginBottom: 12, color: "var(--color-forest)" }}>
          {greeting}, {vendor.name}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: statusBadge.color,
            color: "var(--color-cream)",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
          }}>
            {statusBadge.label}
          </span>
          <span style={{ color: "var(--color-ink-muted)", fontSize: 14 }}>
            On {campusName}
          </span>
        </div>
      </header>

      {vendor.status === "suspended" && (
        <div data-testid="vendor-suspended-banner" role="alert" style={{ background: "var(--color-danger)", color: "var(--color-cream)", padding: "var(--space-3)", borderRadius: 8, marginBottom: "var(--space-3)" }}>
          Your storefront is suspended. Contact support@voeq.ng for details.
        </div>
      )}

      {/* K3b.1 Attention queue indicators */}
      <section style={{ background: "var(--color-cream)", border: "1px solid var(--color-ink-subtle)", borderRadius: 12, padding: "var(--space-4)", marginBottom: "var(--space-4)" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: 0, marginBottom: "var(--space-3)", color: "var(--color-forest)" }}>
          Needs your attention
        </h2>
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
          <VendorGoLiveButton live={live} />
        </div>
      </section>

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
      </div>
    </AppShell>
  );
}
