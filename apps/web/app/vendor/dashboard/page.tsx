import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/session";
import { mockVendorRepo, listListingsByVendor, canVendorBePublic } from "@voeq/data";

/**
 * VS3.4 — Vendor dashboard. After Phase A (account) the vendor lands here and
 * completes Phase B: (1) upload a profile photo, (2) create a first listing.
 * `canGoLive` (derived via canVendorBePublic) flips to true once both are done,
 * at which point the storefront is publicly reachable.
 */
export default async function VendorDashboardPage() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/login");
  if (!identity.vendorId) redirect("/onboarding/vendor");

  const vendor = await mockVendorRepo.getById(identity.vendorId);
  if (!vendor) redirect("/onboarding/vendor");

  const listings = listListingsByVendor(vendor.id);
  const live = canVendorBePublic(vendor);

  return (
    <main data-testid="vendor-dashboard" style={{ minHeight: "100vh", background: "var(--role-bg)", padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h2)" }}>{vendor.name}</h1>
      <p data-testid="vendor-status" style={{ color: "var(--role-muted)" }}>
        Status: {live ? "Public" : "Account ready — not yet public"}
      </p>

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

      <section data-testid="photo-upload" style={{ marginTop: "var(--space-4)" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)" }}>Profile photo</h2>
        {vendor.profilePhotoUrl ? (
          <img src={vendor.profilePhotoUrl} alt="Profile" width={96} height={96} style={{ borderRadius: "50%" }} data-testid="vendor-photo" />
        ) : (
          <p style={{ color: "var(--role-muted)" }}>No photo uploaded yet.</p>
        )}
      </section>

      <section data-testid="listings-section" style={{ marginTop: "var(--space-4)" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)" }}>Listings</h2>
        {listings.length === 0 ? (
          <p style={{ color: "var(--role-muted)" }}>No listings yet — create your first one.</p>
        ) : (
          <ul data-testid="listing-list">
            {listings.map((l) => (
              <li key={l.id}>{l.title} — ₦{l.priceMinMinor / 100}</li>
            ))}
          </ul>
        )}
      </section>

      <div data-testid="can-go-live" style={{ marginTop: "var(--space-4)" }}>
        {live ? (
          <p style={{ color: "var(--color-accent-gold)" }}>Your storefront is live. 🎉</p>
        ) : (
          <p style={{ color: "var(--role-muted)" }}>
            Complete the photo and first listing to go public.
          </p>
        )}
      </div>
    </main>
  );
}
