import { useState } from "react";
import type { ExploreListing } from "@voeq/data";
import { CampusFingerprint } from "@voeq/contour";
import { Heart } from "lucide-react";

/**
 * ListingCard — THE identity-defining component (Doc 05 C.3.1, Compact/Editorial hybrid for
 * Explore grid). Imagery-led frame (B.6: 4:3 matte), title (h3/body), price as TABULAR data
 * (always legible, never recedes), availability chip, trust row (verified/rating/featured).
 * States: missing image -> contour monogram (NOT broken-image icon); sold-out -> struck/muted;
 * loading -> shimmer in frame.
 * 
 * Now includes bookmark heart icon (top-right corner).
 */
function formatPrice(minor: number): string {
  return `₦ ${(minor / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

const AVAIL_LABEL: Record<string, string> = { open: "Open now", closed: "Sold out", soon: "Opening soon" };
const AVAIL_TONE: Record<string, string> = { open: "success", closed: "error", soon: "warning" };

export function ListingCard({ 
  listing, 
  loading,
  isBookmarked,
  onToggleBookmark,
}: { 
  listing: ExploreListing; 
  loading?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (listingId: string) => void;
}) {
  const img = listing.image;
  const images = listing.images && listing.images.length > 0 ? listing.images : img ? [img] : [];
  const [hovered, setHovered] = useState(false);
  const displayImg = hovered && images[1] ? images[1] : images[0];
  
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleBookmark) {
      onToggleBookmark(listing.id);
    }
  };

  return (
    <article
      data-testid="listing-card"
      onMouseEnter={(e) => {
        setHovered(true);
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--role-surface)",
        border: "1px solid var(--role-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        transition: "transform 200ms ease, box-shadow 200ms ease",
      }}
    >
      {/* Image frame (B.6): 4:3 matte; missing -> contour monogram; loading -> shimmer */}
      <div
        data-testid="listing-image-frame"
        style={{
          position: "relative",
          aspectRatio: "4 / 3",
          background: "var(--role-surface-sunken)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div data-testid="listing-shimmer" style={shimmerStyle} />
        ) : img ? (
          <img
            src={displayImg}
            alt={listing.title}
            data-testid="listing-image"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <CampusFingerprint
            data-testid="listing-monogram"
            activity={[0.6, 0.3, 0.8]}
            style={{ width: 56, height: 56 }}
          />
        )}
        
        {/* Bookmark heart icon (top-right corner) */}
        {!loading && onToggleBookmark && (
          <button
            onClick={handleBookmarkClick}
            data-testid="bookmark-button"
            aria-label={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <Heart
              size={18}
              fill={isBookmarked ? "var(--color-forest)" : "none"}
              stroke={isBookmarked ? "var(--color-forest)" : "var(--color-ink-muted)"}
              strokeWidth={2}
            />
          </button>
        )}
      </div>

      {/* Meta strip: title + price (tabular, always legible) + availability chip */}
      <div style={{ padding: "var(--space-1)", display: "flex", flexDirection: "column", gap: 4 }}>
        <h3
          data-testid="listing-title"
          style={{
            margin: 0,
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--role-text)",
            fontFamily: "var(--role-font-ui)",
            textDecoration: listing.soldOut ? "line-through" : "none",
            opacity: listing.soldOut ? 0.55 : 1,
          }}
        >
          {listing.title}
        </h3>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span
            data-testid="listing-price"
            style={{
              fontFamily: "var(--role-font-mono)",
              fontVariantNumeric: "tabular-nums",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--role-text)", // price NEVER recedes — always full-contrast
            }}
          >
            {formatPrice(listing.priceMinor)}
          </span>
          {listing.availability && (
            listing.availability === "open" ? (
              <span data-testid="listing-card-open-badge">
                <span
                  data-testid="listing-availability"
                  data-tone={AVAIL_TONE[listing.availability]}
                  style={{
                    fontSize: "11px",
                    padding: "2px 6px",
                    border: "1px solid var(--role-border)",
                    borderRadius: 999,
                    color: "var(--role-text-muted)",
                  }}
                >
                  {AVAIL_LABEL[listing.availability]}
                </span>
              </span>
            ) : (
              <span
                data-testid="listing-availability"
                data-tone={AVAIL_TONE[listing.availability]}
                style={{
                  fontSize: "11px",
                  padding: "2px 6px",
                  border: "1px solid var(--role-border)",
                  borderRadius: 999,
                  color: "var(--role-text-muted)",
                }}
              >
                {AVAIL_LABEL[listing.availability]}
              </span>
            )
          )}
        </div>

        {/* Trust row (C.3.2): rating / featured mark */}
        <div data-testid="listing-trust" style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "12px", color: "var(--role-text-muted)" }}>
          {typeof listing.vendorRatingAvg === "number" && (listing.vendorRatingCount ?? 0) > 0 ? (
            <span data-testid="listing-card-rating">★ {listing.vendorRatingAvg.toFixed(1)} <span style={{ color: "var(--role-text-muted)", fontSize: 12 }}>({listing.vendorRatingCount})</span></span>
          ) : (
            <span data-testid="listing-card-rating-empty" style={{ color: "var(--role-text-muted)", fontSize: 12 }}>New</span>
          )}
          {listing.featured && (
            <span data-testid="listing-featured" style={{ color: "var(--role-gold)" }}>
              Featured
            </span>
          )}
        </div>
        
        {/* Vendor name with location - industrial standard */}
        <div style={{ fontSize: "12px", color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}>
          <span data-testid="listing-vendor-name">{listing.vendorName}</span>
          {listing.categorySlug && (
            <span data-testid="listing-location" style={{ marginLeft: 4 }}>
              • {listing.categorySlug}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

const shimmerStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(90deg, var(--role-surface-sunken) 0%, rgba(255,255,255,0.5) 50%, var(--role-surface-sunken) 100%)",
  backgroundSize: "200% 100%",
};
