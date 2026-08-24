import { redirect } from "next/navigation";
import { requireConsent } from "@/lib/session";
import { mockUserPrefRepo, campuses } from "@voeq/data";
import { ShopperDashboard } from "@/components/shopper/ShopperDashboard";

/**
 * VS4.7 — shopper dashboard (PG-SHOP-001). K3a.1 enhanced.
 * Campus-scoped per Doc 03. Guards the shopper-onboarding gate, then renders the
 * real dashboard (Saved / Following / Recommended / Activity / Notifications).
 * Auth redirect preserves ?next= so post-login returns here (Doc 03 §3.9).
 * FIX #2: Now enforces consent acceptance before allowing access.
 */
export default async function HomePage() {
  const identity = await requireConsent("/home");

  const prefs = await mockUserPrefRepo.get(identity.id);
  if (!prefs || !prefs.feedPrefsSetAt) redirect("/onboarding/shopper");

  const campusLabel = identity.campus
    ? (campuses.find((c) => c.id === identity.campus)?.name ?? "your campus")
    : "your campus";

  return (
    <main
      data-testid="shopper-home"
      style={{
        minHeight: "100vh",
        background: "var(--color-glass-white)",
        padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)",
      }}
    >
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
    </main>
  );
}
