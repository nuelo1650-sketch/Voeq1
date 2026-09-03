import { redirect } from "next/navigation";
import { requireConsent, getStaffIdentity } from "@/lib/session";
import { mockUserPrefRepo, mockCampusRepo } from "@voeq/data";
import { ShopperDashboard } from "@/components/shopper/ShopperDashboard";
import { AppShell } from "@/components/shell/AppShell";

/**
 * VS4.7 — shopper dashboard (PG-SHOP-001). K3a.1 enhanced.
 * Campus-scoped per Doc 03. Guards the shopper-onboarding gate, then renders the
 * real dashboard (Saved / Following / Recommended / Activity / Notifications).
 * Auth redirect preserves ?next= so post-login returns here (Doc 03 §3.9).
 * FIX #2: Now enforces consent acceptance before allowing access.
 *
 * P-A round 69 (ROLE SEMANTICS — "shopper becoming a vendor: what dashboard
 * does he have?"): the AppShell role is now DERIVED from the identity — a
 * vendor (vendorId + role vendor/live) sees the VENDOR shell (dashboard/
 * listings/analytics), not the shopper bottom nav. The old code hardcoded
 * role="shopper" here, so a live vendor's Home was the shopper home + a
 * "Become a vendor" CTA for someone who ALREADY is one.
 */
export default async function HomePage() {
  const identity = await requireConsent("/home");

  // P-A round 69: staffRole is a SEPARATE dimension (super_admin/admin/
  // moderator) — surface Admin in the shell wherever their app role lands.
  const staff = await getStaffIdentity();

  // Vendor? (identity.role widens to "vendor" at go-live; vendorId set at
  // onboarding) -> vendor shell, NOT shopper home. MUST run before the
  // shopper-prefs gate: a vendor has no shopper feed preferences, so the old
  // order dumped valid vendors into /onboarding/shopper forever.
  if (identity.vendorId != null && identity.role === "vendor") {
    redirect("/vendor/dashboard");
  }

  const prefs = await mockUserPrefRepo.get(identity.id);
  if (!prefs || !prefs.feedPrefsSetAt) redirect("/onboarding/shopper");

  const campusList = await mockCampusRepo.list(identity.id);
  const campusLabel = identity.campus
    ? (campusList.find((c) => c.id === identity.campus)?.name ?? "your campus")
    : "your campus";

  return (
    <AppShell role="shopper" userName={identity.name} staffRole={staff?.staffRole ?? null}>
      <div data-testid="shopper-home">
        <ShopperDashboard name={identity.name || "shopper"} campus={campusLabel} />

        {!identity.vendorId && (
          <section
            aria-label="Become a vendor"
            data-testid="home-become-vendor-banner"
            style={{
              marginTop: "var(--space-4)",
              border: "1px solid var(--color-amber)",
              borderRadius: 8,
              padding: "var(--space-3)",
              background: "var(--color-cream)",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0, marginBottom: 8, color: "var(--color-forest)" }}>
              Got something to sell?
            </h2>
            <p style={{ color: "var(--color-ink-muted)", marginTop: 0, marginBottom: "var(--space-2)", fontSize: 14 }}>
              Turn your skills or products into a campus business — free to list.
            </p>
            <a
              href="/become-vendor"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                background: "var(--color-forest)",
                color: "var(--color-cream)",
                textDecoration: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
              }}
              data-testid="home-become-vendor-cta"
            >
              Become a vendor
            </a>
          </section>
        )}
      </div>
    </AppShell>
  );
}
