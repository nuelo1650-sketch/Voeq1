import type { ExploreListing } from "@voeq/data";
import { CampusFingerprint } from "@voeq/contour";

/**
 * ListingCard — THE identity-defining component (Doc 05 C.3.1, Compact/Editorial hybrid for
 * Explore grid). Imagery-led frame (B.6: 4:3 matte), title (h3/body), price as TABULAR data
 * (always legible, never recedes), availability chip, trust row (verified/rating/featured).
 * States: missing image -> contour monogram (NOT broken-image icon); sold-out -> struck/muted;
 * loading -> shimmer in frame.
 */
function formatPrice(minor: number): string {
  return `R ${(minor / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
}

const AVAIL_LABEL: Record<string, string> = { open: "Open now", closed: "Sold out", soon: "Opening soon" };
const AVAIL_TONE: Record<string, string> = { open: "success", closed: "error", soon: "warning" };

export function ListingCard({ listing, loading }: { listing: ExploreListing; loading?: boolean }) {
  const img = listing.image;
  return (
    <article
      data-testid="listing-card"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--role-surface)",
        border: "1px solid var(--role-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
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
            src={img}
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
          )}
        </div>

        {/* Trust row (C.3.2): verified badge / rating / featured mark */}
        <div data-testid="listing-trust" style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "12px", color: "var(--role-text-muted)" }}>
          {listing.verified && (
            <span data-testid="listing-verified" style={{ color: "var(--role-accent-strong)" }}>
              ✓ Student Vouched
            </span>
          )}
          {typeof listing.rating === "number" && (
            <span data-testid="listing-rating">★ {listing.rating.toFixed(1)}</span>
          )}
          {listing.featured && (
            <span data-testid="listing-featured" style={{ color: "var(--role-gold)" }}>
              Featured
            </span>
          )}
          <span style={{ marginLeft: "auto", color: "var(--role-text-muted)" }}>{listing.vendorName}</span>
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
  animation: "contour-shimmer 1.2s linear infinite",
};
