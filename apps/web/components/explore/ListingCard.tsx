import { useState } from "react";
import type { ExploreListing } from "@voeq/data";
import { CampusFingerprint } from "@voeq/contour";
import { Heart } from "lucide-react";
import { cdnTransform } from "@/lib/image-upload";

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
  // P-A round 81 (F): the second image used to be hover-only — on a phone there
  // is no hover, so extra photos were invisible unless you opened the listing.
  // Now: horizontal scroll-snap track (native touch swipe) + dot indicators.
  const [activeIndex, setActiveIndex] = useState(0);
  const handleTrackScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.clientWidth === 0) return;
    const idx = Math.max(0, Math.min(images.length - 1, Math.round(el.scrollLeft / el.clientWidth)));
    setActiveIndex((prev) => (prev === idx ? prev : idx));
  };
  // P-A round 65: delivery transforms (f_auto,q_auto,w=400) + lazy — the
  // raw full-size Cloudinary file was the "slow, page shrinks" culprit.
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
    >
      {/* Image frame (4:3); missing -> contour monogram; loading -> shimmer.
          P-A round 81 (F): multi-image listings render as a swipeable
          scroll-snap track; single-image stays a plain <img>. */}
      <div data-testid="listing-image-frame" className="voeq-card-image">
        {loading ? (
          <div data-testid="listing-shimmer" style={shimmerStyle} />
        ) : images.length > 1 ? (
          <>
            <div
              className="voeq-card-track"
              data-testid="listing-image-track"
              onScroll={handleTrackScroll}
            >
              {images.map((src, i) => (
                <img
                  key={`${src}-${i}`}
                  src={cdnTransform(src ?? "", 400)}
                  alt={`${listing.title} — photo ${i + 1} of ${images.length}`}
                  data-testid={i === 0 ? "listing-image" : undefined}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              ))}
            </div>
            <div className="voeq-card-dots" aria-hidden="true">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`voeq-card-dot${i === activeIndex ? " is-active" : ""}`}
                />
              ))}
            </div>
          </>
        ) : img ? (
          <img src={cdnTransform(img, 400)} alt={listing.title} data-testid="listing-image" loading="lazy" decoding="async" />
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
