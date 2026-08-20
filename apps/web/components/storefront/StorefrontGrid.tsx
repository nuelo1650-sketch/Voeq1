"use client";

import type { ExploreListing } from "@voeq/data";
import { ListingCard } from "@/components/explore/ListingCard";

/**
 * StorefrontGrid — the vendor's own listings (PG-PUB-004). Reuses the identity-
 * defining `ListingCard` (price stays as legible tabular data — never removed).
 * Responsive: 3 cols desktop / 2 tablet / 1 mobile. Max 15 (B.16 stress test is
 * deferred to C.6 — here we simply cap what the data layer returns).
 */

const MAX_LISTINGS = 15;

export function StorefrontGrid({ listings }: { listings: ExploreListing[] }) {
  const shown = listings.slice(0, MAX_LISTINGS);
  return (
    <section
      data-testid="storefront-grid"
      aria-label="Listings from this vendor"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "var(--space-2)",
        marginBottom: "var(--space-6)",
      }}
    >
      {shown.length === 0 ? (
        <p data-testid="storefront-grid-empty" style={{ gridColumn: "1 / -1", color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}>
          No listings from this vendor yet.
        </p>
      ) : (
        shown.map((l) => <ListingCard key={l.id} listing={l} />)
      )}
    </section>
  );
}
