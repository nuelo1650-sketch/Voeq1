"use client";

import { useState } from "react";
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
            minWidth: 0,
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
            minWidth: 0,
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
  // BUG-C (2026-09-06): recommendation cards show ALL photos (was single image).
  // MATRIX FIX (2026-09-06): filter falsy image URLs (empty string in
  // images[] rendered <img src=""> — same guard as ListingCard). This is the
  // rail that broke the prod matrix on /vendor/4d64781a (Gel Manicure).
  const imgs = (Array.isArray(listing.images) && listing.images.length > 0
    ? listing.images
    : listing.image ? [listing.image] : []).filter((u): u is string => typeof u === "string" && u.trim() !== "");
  const [idx, setIdx] = useState(0);
  return (
    <Link
      href={`/listing/${listing.id}`}
      style={{
        flexShrink: 0,
        width: "min(280px, 78vw)",
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
        position: "relative",
        overflow: "hidden",
      }}>
        {imgs.length > 0 ? (
          <>
            <div
              data-testid="recommend-card-track"
              className="voeq-card-track"
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.clientWidth === 0) return;
                const i = Math.max(0, Math.min(imgs.length - 1, Math.round(el.scrollLeft / el.clientWidth)));
                setIdx((prev) => (prev === i ? prev : i));
              }}
              style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", width: "100%", height: "100%", scrollbarWidth: "none" }}
            >
              {imgs.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`${listing.title} — photo ${i + 1}`} loading="lazy" style={{ minWidth: "100%", width: "100%", height: "100%", objectFit: "cover", display: "block", scrollSnapAlign: "start" }} />
              ))}
            </div>
            {imgs.length > 1 && (
              <div style={{ position: "absolute", bottom: 6, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5, pointerEvents: "none" }}>
                {imgs.map((_, i) => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i === idx ? "var(--color-cream)" : "rgba(246,241,230,.45)", boxShadow: "0 0 2px rgba(15,42,29,.5)" }} />
                ))}
              </div>
            )}
          </>
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
        {typeof listing.vendorRatingAvg === "number" && (listing.vendorRatingCount ?? 0) > 0 ? (
          <div style={{
            fontSize: "12px",
            color: "var(--role-text-muted)",
            fontFamily: "var(--role-font-ui)",
          }}>
            ★ {listing.vendorRatingAvg.toFixed(1)} ({listing.vendorRatingCount})
          </div>
        ) : (
          <div style={{
            fontSize: "12px",
            color: "var(--role-text-muted)",
            fontFamily: "var(--role-font-ui)",
          }}>
            New
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
