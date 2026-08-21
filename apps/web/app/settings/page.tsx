import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/session";
import { mockVendorRepo } from "@voeq/data";

/**
 * VS3.6 (Reversal 8) — Settings. The "Become a vendor" CTA is ALWAYS present here,
 * regardless of role/eligibility. If the user already has a vendor account, the
 * CTA points to the dashboard instead of the setup wizard.
 */
export default async function SettingsPage() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/login?next=/settings");

  const isVendor = !!identity.vendorId;
  const vendorLabel = isVendor ? (await mockVendorRepo.getById(identity.vendorId!))?.name : null;

  return (
    <main
      data-testid="settings-page"
      style={{ minHeight: "100vh", background: "var(--role-bg)", padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)" }}
    >
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h2)" }}>Settings</h1>

      <section className="auth-card" style={{ marginTop: "var(--space-3)" }} data-testid="settings-account">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)" }}>Account</h2>
        <p style={{ color: "var(--role-muted)" }}>Email: {identity.email}</p>
        <p style={{ color: "var(--role-muted)" }}>Role: {identity.role}</p>
      </section>

      <section
        className="auth-card"
        style={{ marginTop: "var(--space-3)" }}
        data-testid="settings-become-vendor"
      >
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)" }}>Selling</h2>
        {isVendor ? (
          <p>
            You're a vendor{ vendorLabel ? `: ${vendorLabel}` : "" }.{" "}
            <Link href="/vendor/dashboard" className="info-link">Go to dashboard</Link>
          </p>
        ) : (
          <Link href="/become-vendor" className="auth-submit" data-testid="settings-become-vendor-cta" style={{ textDecoration: "none", display: "inline-block", marginTop: "var(--space-2)" }}>
            Become a vendor
          </Link>
        )}
      </section>
    </main>
  );
}
