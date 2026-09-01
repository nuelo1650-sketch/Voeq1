import { useState } from "react";
import type { ExploreListing } from "@voeq/data";
import { CampusFingerprint } from "@voeq/contour";
import { Heart } from "lucide-react";

/**
 * ListingCard — THE identity-defining marketplace card (Voeq Design System, 2026-08-30).
 *
 * Rebuilt on the `.voeq-card` primitives (mobile-first). Fixes the bug where the
 * vendor "location" rendered a raw category slug (e.g. "• food-drinks"); it now
 * shows the friendly category NAME from the canonical taxonomy. Imagery-led
 * (4:3), price always legible + tabular, availability chip, trust row, bookmark.
 * States: no image -> contour monogram; sold out -> muted; loading -> shimmer.
 *
 * ZERO logic change — same props, same data-testids, same behaviours.
 */
function formatPrice(minor: number): string {
  return `₦${(minor / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

const AVAIL_LABEL: Record<string, string> = { open: "Open now", closed: "Sold out", soon: "Opening soon" };
const AVAIL_CLASS: Record<string, string> = {
  open: "voeq-chip-avail voeq-chip-avail--open",
  closed: "voeq-chip-avail voeq-chip-avail--closed",
  soon: "voeq-chip-avail voeq-chip-avail--soon",
};

// Friendly category name from slug (no raw slugs on the card).
const SLUG_TO_NAME: Record<string, string> = {
  "food-drinks": "Food & Drinks",
  fashion: "Fashion",
  "tech-repairs": "Tech & Repairs",
  "beauty-care": "Beauty & Care",
  "academic-services": "Academic",
  books: "Books",
  printing: "Printing",
  photography: "Photography",
  tailoring: "Tailoring",
  logistics: "Logistics",
  "home-essentials": "Home Essentials",
  "health-wellness": "Health & Wellness",
  groceries: "Groceries",
  tutorials: "Tutorials",
  rentals: "Rentals",
  events: "Events",
  "travel-transport": "Transport",
  "student-support": "Student Support",
  other: "Other",
};

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
  const categoryName = listing.categorySlug ? SLUG_TO_NAME[listing.categorySlug] ?? listing.categorySlug : null;

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleBookmark) onToggleBookmark(listing.id);
  };

  return (
    <article
      data-testid="listing-card"
      className="voeq-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image frame (4:3); missing -> contour monogram; loading -> shimmer */}
      <div data-testid="listing-image-frame" className="voeq-card-image">
        {loading ? (
          <div data-testid="listing-shimmer" style={shimmerStyle} />
        ) : img ? (
          <img src={displayImg} alt={listing.title} data-testid="listing-image" />
        ) : (
          <CampusFingerprint
            data-testid="listing-monogram"
            activity={[0.6, 0.3, 0.8]}
            style={{ width: 56, height: 56 }}
          />
        )}

        {/* Bookmark heart (top-right) */}
        {!loading && onToggleBookmark && (
          <button
            onClick={handleBookmarkClick}
            data-testid="bookmark-button"
            aria-label={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
            className={`voeq-card-bookmark${isBookmarked ? " is-active" : ""}`}
          >
            <Heart
              size={18}
              fill={isBookmarked ? "var(--color-forest)" : "none"}
              stroke={isBookmarked ? "var(--color-forest)" : "currentColor"}
              strokeWidth={2}
            />
          </button>
        )}
      </div>

      {/* Meta strip */}
      <div className="voeq-card-body">
        <h3 data-testid="listing-title" className="voeq-card-title">
          {listing.title}
        </h3>

        <div className="voeq-card-meta">
          <span data-testid="listing-price" className="voeq-card-price">
            {formatPrice(listing.priceMinor)}
          </span>
          {listing.availability && (
            <span
              data-testid="listing-availability"
              className={AVAIL_CLASS[listing.availability] ?? "voeq-chip-avail"}
            >
              {AVAIL_LABEL[listing.availability]}
            </span>
          )}
        </div>

        {/* Trust row */}
        <div data-testid="listing-trust" className="voeq-card-rating">
          {typeof listing.vendorRatingAvg === "number" && (listing.vendorRatingCount ?? 0) > 0 ? (
            <span data-testid="listing-card-rating">
              <span className="star">★</span> {listing.vendorRatingAvg.toFixed(1)}{" "}
              <span>({listing.vendorRatingCount})</span>
            </span>
          ) : (
            <span data-testid="listing-card-rating-empty">New</span>
          )}
          {listing.featured && (
            <span data-testid="listing-featured" className="voeq-badge voeq-badge--featured">
              Featured
            </span>
          )}
        </div>

        {/* Vendor + friendly category (was raw slug — fixed) */}
        <div className="voeq-card-vendor">
          <span data-testid="listing-vendor-name">{listing.vendorName}</span>
          {categoryName && (
            <span data-testid="listing-category" className="voeq-card-cat">
              {categoryName}
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
  animation: "shimmer 1.4s infinite",
};
