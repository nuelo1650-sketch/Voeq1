import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/session";
import { mockUserPrefRepo, campuses } from "@voeq/data";
import { ShopperDashboard } from "@/components/shopper/ShopperDashboard";

/**
 * VS4.7 — shopper dashboard (PG-SHOP-001).
 * Campus-scoped per Doc 03. Guards the shopper-onboarding gate, then renders the
 * real dashboard (Saved / Following / Recommended / Activity / Notifications).
 * Auth redirect preserves ?next= so post-login returns here (Doc 03 §3.9).
 */
export default async function HomePage() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect(`/login?next=${encodeURIComponent("/home")}`);

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
        background: "var(--role-bg)",
        padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)",
      }}
    >
      <header style={{ marginBottom: "var(--space-3)" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h2)",
            color: "var(--role-fg)",
          }}
        >
          Welcome, {identity.name || "shopper"}
        </h1>
        <p style={{ color: "var(--role-muted)", marginTop: "var(--space-1)" }}>
          Showing what’s open near {campusLabel}.
        </p>
      </header>

      <section
        aria-label="Quick actions"
        style={{
          display: "flex",
          gap: "var(--space-2)",
          flexWrap: "wrap",
          marginBottom: "var(--space-4)",
        }}
      >
        <a href="/explore" className="auth-submit" style={{ textDecoration: "none" }} data-testid="home-explore">
          Browse {campusLabel}
        </a>
        <a href="/c/food-drinks" className="auth-secondary" style={{ textDecoration: "none" }} data-testid="home-food">
          Food &amp; Drinks
        </a>
      </section>

      <ShopperDashboard name={identity.name || "shopper"} />

      {!identity.vendorId && (
        <section
          aria-label="Become a vendor"
          data-testid="home-become-vendor-banner"
          style={{
            marginTop: "var(--space-4)",
            border: "1px solid var(--color-accent-gold)",
            borderRadius: "var(--radius-card)",
            padding: "var(--space-3)",
            background: "var(--surface-1)",
          }}
        >
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)" }}>
            Got something to sell?
          </h2>
          <p style={{ color: "var(--role-muted)", marginTop: "var(--space-1)" }}>
            Turn your skills or products into a campus business — free to list.
          </p>
          <a
            href="/become-vendor"
            className="auth-submit"
            style={{ textDecoration: "none", display: "inline-block", marginTop: "var(--space-2)" }}
            data-testid="home-become-vendor-cta"
          >
            Become a vendor
          </a>
        </section>
      )}
    </main>
  );
}
