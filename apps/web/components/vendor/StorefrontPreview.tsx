import { StorefrontHero } from "@/components/storefront/StorefrontHero";
import { StorefrontGrid } from "@/components/storefront/StorefrontGrid";
import type { VendorStorefrontView } from "@voeq/data";

/**
 * VS5.4 — Live storefront preview. Renders the EXACT public storefront components
 * (StorefrontHero + StorefrontGrid) against a synthesized VendorStorefrontView so
 * the vendor sees, in real time, what shoppers will see as they edit (VS5.2/3).
 * No second code path — same components, same design tokens.
 */
export function StorefrontPreview({ view }: { view: VendorStorefrontView }) {
  return (
    <div
      data-testid="storefront-preview"
      data-env="deep"
      style={{
        border: "1px solid var(--role-border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-4)",
        background: "var(--role-bg)",
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--role-text-muted)", marginBottom: "var(--space-2)" }}>
        Live preview — what shoppers see
      </div>
      <StorefrontHero vendor={view} />
      <StorefrontGrid listings={view.listings} />
    </div>
  );
}
