"use client";

import Link from "next/link";
import type { ExploreListing } from "@voeq/data";
import { CampusFingerprint } from "@voeq/contour";

/**
 * StorefrontRecommendations — K2.5 recommendation rows for vendor storefront.
 * Features:
 * - "Explore more listings" - other listings from different vendors on same campus
 * - "Related vendors" - listings from same category but different vendors
 * - Horizontal scroll with 280px cards matching K2.3 ListingCard design
 * - Honest empty states (don't show sections if no data)
 */

interface StorefrontRecommendationsProps {
  otherListings: ExploreListing[];
  relatedVendors: ExploreListing[];
  vendorName: string;
}

function formatPrice(minor: number): string {
  return `₦ ${(minor / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export function StorefrontRecommendations({ otherListings, relatedVendors, vendorName }: StorefrontRecommendationsProps) {
  const hasOtherListings = otherListings.length > 0;
  const hasRelatedVendors = relatedVendors.length > 0;

  // Don't render if no recommendations (K2.5 #4 edge case)
  if (!hasOtherListings && !hasRelatedVendors) {
    return null;
  }

  return (
    <div style={{ marginBottom: "var(--space-6)" }}>
      {/* Explore more listings (K2.5 #2) */}
      {hasOtherListings && (
        <section style={{ marginBottom: "var(--space-6)" }}>
          <h2 style={{
            fontFamily: "var(--role-font-display)",
            fontSize: "24px",
            marginBottom: "var(--space-3)",
            color: "var(--role-text)",
          }}>
            Explore more listings
          </h2>
          <div style={{ 
            display: "flex", 
            gap: "var(--space-3)", 
            overflowX: "auto",
            paddingBottom: "var(--space-2)",
          }}>
            {otherListings.map((item) => (
              <RecommendationCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}

      {/* Related vendors (K2.5 #3) */}
      {hasRelatedVendors && (
        <section style={{ marginBottom: "var(--space-6)" }}>
          <h2 style={{
            fontFamily: "var(--role-font-display)",
            fontSize: "24px",
            marginBottom: "var(--space-3)",
            color: "var(--role-text)",
          }}>
            Similar vendors you might like
          </h2>
          <div style={{ 
            display: "flex", 
            gap: "var(--space-3)", 
            overflowX: "auto",
            paddingBottom: "var(--space-2)",
          }}>
            {relatedVendors.map((item) => (
              <RecommendationCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Recommendation card matching K2.3 ListingCard design */
function RecommendationCard({ listing }: { listing: ExploreListing }) {
  return (
    <Link
      href={`/listing/${listing.id}`}
      style={{
        flexShrink: 0,
        width: 280,
        border: "1px solid var(--role-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        background: "var(--role-surface)",
        textDecoration: "none",
        transition: "box-shadow 120ms ease, transform 120ms ease",
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
        height: 180,
        background: "var(--role-surface-sunken)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {listing.image ? (
          <img src={listing.image} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <CampusFingerprint activity={[0.5, 0.5, 0.5]} style={{ width: 48, height: 48 }} />
        )}
      </div>
      <div style={{ padding: "var(--space-2)" }}>
        <div style={{
          fontSize: "15px",
          fontWeight: 600,
          color: "var(--role-text)",
          fontFamily: "var(--role-font-ui)",
          marginBottom: 4,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {listing.title}
        </div>
        <div style={{
          fontSize: "13px",
          color: "var(--role-text-muted)",
          fontFamily: "var(--role-font-ui)",
          marginBottom: 8,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {listing.vendorName}
        </div>
        <div style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--role-text)",
          fontFamily: "var(--role-font-mono)",
          marginBottom: 4,
        }}>
          {formatPrice(listing.priceMinor)}
        </div>
        {typeof listing.rating === "number" && (
          <div style={{
            fontSize: "12px",
            color: "var(--role-text-muted)",
            fontFamily: "var(--role-font-ui)",
          }}>
            ★ {listing.rating.toFixed(1)}
          </div>
        )}
        {listing.verified && (
          <div style={{
            fontSize: "11px",
            color: "var(--role-accent-strong)",
            fontFamily: "var(--role-font-ui)",
            marginTop: 4,
            fontWeight: 500,
          }}>
            ✓ Vouched
          </div>
        )}
      </div>
    </Link>
  );
}
