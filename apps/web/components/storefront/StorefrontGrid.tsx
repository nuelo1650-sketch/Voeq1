"use client";

// C1 (2026-09-06): the storefront grid now renders the SHARED ListingCard
// (same design language as Explore; vendor row hidden via onVendor={false}).
// The old StorefrontListingCard twin is deleted.
import type { ExploreListing } from "@voeq/data";
import { ListingCard } from "@/components/explore/ListingCard";

/**
 * StorefrontGrid — K2.4 enhanced vendor listings grid (PG-PUB-004).
 * Features:
 * - Consistent card design matching listing detail recommendation rows
 * - Clickable cards linking to /listing/[id]
 * - Responsive: 3 cols desktop / 2 tablet / 1 mobile
 * - Honest empty state (K2.4 #7)
 */

const MAX_LISTINGS = 15;

function formatPrice(minor: number): string {
  return `₦ ${(minor / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export function StorefrontGrid({ listings }: { listings: ExploreListing[] }) {
  const shown = listings.slice(0, MAX_LISTINGS);
  
  if (shown.length === 0) {
    return (
      <section
        data-testid="storefront-grid"
        aria-label="Listings from this vendor"
        style={{
          padding: "var(--space-4)",
          background: "var(--role-surface-sunken)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--role-border)",
          marginBottom: "var(--space-6)",
        }}
      >
        <p data-testid="storefront-grid-empty" style={{ 
          margin: 0,
          textAlign: "center",
          color: "var(--role-text-muted)", 
          fontFamily: "var(--role-font-ui)",
          fontSize: "15px",
        }}>
          No listings from this vendor yet. Check back soon!
        </p>
      </section>
    );
  }
  
  return (
    <section
      data-testid="storefront-grid"
      aria-label="Listings from this vendor"
      style={{
        marginBottom: "var(--space-6)",
      }}
    >
      <h2 style={{
        fontFamily: "var(--role-font-display)",
        fontSize: "24px",
        marginBottom: "var(--space-3)",
        color: "var(--role-text)",
      }}>
        Listings ({shown.length})
      </h2>
      <div className="vs-grid" style={{ gap: "var(--space-3)" }}>
        {shown.map((l) => (
          <ListingCard key={l.id} listing={l} onVendor={false} />
        ))}
      </div>
    </section>
  );
}

