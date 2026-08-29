import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/session";
import { mockVendorRepo } from "@voeq/data";
import { InfoPageShell } from "@/components/info/InfoPageShell";

/**
 * VS3.6 (Reversal 8) — "Become a vendor" destination page. This is the prominent
 * CTA target from /for-vendors and the footer. If the user already has a vendor
 * account, bounce to the dashboard. Otherwise it's an explainer + entry to the
 * Phase A wizard (/onboarding/vendor).
 */
export default async function BecomeVendorPage() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/login?next=/become-vendor");
  if (identity.vendorId) {
    const v = await mockVendorRepo.getById(identity.vendorId);
    if (v) redirect("/vendor/dashboard");
  }

  return (
    <InfoPageShell title="Become a vendor">
      <div className="info-page-content" data-testid="become-vendor">
        <section className="info-section">
          <p className="info-lead">
            Turn your skills and products into a campus business. Voeq is free to
            list — no fees, no commissions. You keep everything you earn.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">What you&apos;ll set up</h2>
          <ol className="info-list info-list-numbered">
            <li>
              <strong>Account</strong> — your business name, description, campus,
              and the Vendor Agreement.
            </li>
            <li>
              <strong>Profile</strong> — add a profile photo and your first listing.
            </li>
            <li>
              <strong>Go live</strong> — once both steps are done, your storefront
              goes public on your campus.
            </li>
          </ol>
        </section>

        <section className="info-section">
          <div className="vendor-cta-group" data-testid="become-vendor-cta">
            {/*
              P2 fix (2026-08-29): this page REQUIRES login (see redirect above), so every
              visitor here already has an account. Sending a signed-in shopper to /signup
              forced account recreation. Now the CTA starts vendor onboarding directly —
              step-1 creates the vendor and links identity.vendorId (account "swap").
            */}
            <Link href="/onboarding/vendor" className="vendor-cta-primary">
              Start vendor setup
            </Link>
            <Link href="/for-vendors" className="vendor-cta-secondary">
              Learn more
            </Link>
          </div>
        </section>
      </div>
    </InfoPageShell>
  );
}
