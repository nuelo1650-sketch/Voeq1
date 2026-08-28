"use client";

import Link from "next/link";
import type { ExploreListing } from "@voeq/data";
import { CampusFingerprint } from "@voeq/contour";

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
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "var(--space-3)",
      }}>
        {shown.map((l) => (
          <StorefrontListingCard key={l.id} listing={l} />
        ))}
      </div>
    </section>
  );
}

/** Storefront listing card matching K2.3 ListingCard design */
function StorefrontListingCard({ listing }: { listing: ExploreListing }) {
  return (
    <Link
      href={`/listing/${listing.id}`}
      data-testid="storefront-listing-card"
      style={{
        border: "1px solid var(--role-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        background: "var(--role-surface)",
        textDecoration: "none",
        transition: "box-shadow 120ms ease, transform 120ms ease",
        display: "block",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{
        width: "100%",
        height: 200,
        background: "var(--role-surface-sunken)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}>
        {listing.image ? (
          <img src={listing.image} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <CampusFingerprint activity={[0.5, 0.5, 0.5]} style={{ width: 56, height: 56 }} />
        )}
      </div>
      <div style={{ padding: "var(--space-2)" }}>
        <div style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--role-text)",
          fontFamily: "var(--role-font-ui)",
          marginBottom: 6,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {listing.title}
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}>
          <div style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--role-text)",
            fontFamily: "var(--role-font-mono)",
          }}>
            {formatPrice(listing.priceMinor)}
          </div>
          {listing.availability && (
            <span style={{
              fontSize: "11px",
              padding: "3px 8px",
              background: listing.availability === "open" 
                ? "rgba(15, 42, 29, 0.1)" 
                : listing.availability === "closed"
                ? "rgba(220, 38, 38, 0.1)"
                : "rgba(245, 158, 11, 0.1)",
              color: listing.availability === "open" 
                ? "var(--color-forest)" 
                : listing.availability === "closed"
                ? "#dc2626"
                : "#f59e0b",
              borderRadius: 999,
              fontFamily: "var(--role-font-ui)",
              fontWeight: 500,
            }}>
              {listing.availability === "open" ? "Open" : listing.availability === "closed" ? "Sold out" : "Soon"}
            </span>
          )}
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "12px",
          color: "var(--role-text-muted)",
          fontFamily: "var(--role-font-ui)",
        }}>
          {typeof listing.vendorRatingAvg === "number" && (listing.vendorRatingCount ?? 0) > 0 ? (
            <span>★ {listing.vendorRatingAvg.toFixed(1)} ({listing.vendorRatingCount})</span>
          ) : (
            <span style={{ fontSize: 12, color: "var(--role-text-muted)" }}>New</span>
          )}
          {listing.featured && (
            <span style={{ color: "#f59e0b", fontWeight: 500 }}>Featured</span>
          )}
        </div>
      </div>
    </Link>
  );
}
