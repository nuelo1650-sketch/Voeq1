import { useState } from "react";
import Link from "next/link";
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
  onVendor = true,
  link = true,
}: {
  listing: ExploreListing;
  loading?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (listingId: string) => void;
  /** C1 (2026-09-06): storefront grids pass false — a store's own grid
   *  shouldn't repeat its own name on every card. */
  onVendor?: boolean;
  /** CLICKABILITY FIX (2026-09-07): C1 deleted the old linked
   *  StorefrontListingCard twin but the shared card never carried its own
   *  <Link> — Explore/EmptyState wrapped it externally, so every OTHER
   *  surface (storefront grid, rails, detail cross-sells) rendered DEAD
   *  cards. The card now self-links by default; wrappers pass link={false}
   *  (nested <a> is invalid HTML). */
  link?: boolean;
}) {
  const img = listing.image;
  // MATRIX FIX (2026-09-06): a demo listing carries an EMPTY string in
  // images[] — the swipe track rendered it as <img src=""> and the prod
  // verify-matrix flagged a broken image at phone-390. Filter falsy URLs at
  // the card (the same guard belongs anywhere images[] maps to <img>).
  const rawImages = listing.images && listing.images.length > 0 ? listing.images : img ? [img] : [];
  const images = rawImages.filter((u): u is string => typeof u === "string" && u.trim() !== "");
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

  const card = (
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

        {/* C1: status pills ride the image (top-left) — Featured (amber) +
            availability (Open-now family) moved off the body to keep the card
            calm; verified vendors already get the footer treatment. */}
        {!loading && (listing.featured || listing.availability) && (
          <div className="voeq-card-imgpills">
            {listing.featured && (
              <span data-testid="listing-featured" className="voeq-imgpill voeq-imgpill--featured">Featured</span>
            )}
            {listing.availability && (
              <span data-testid="listing-availability" className="voeq-imgpill">· {AVAIL_LABEL[listing.availability]}</span>
            )}
          </div>
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

      {/* C1 CARD (2026-09-06, founder-picked from mock2): eyebrow → serif
          display title → verified vendor row → price+rating footer. */}
      <div className="voeq-card-body">
        <div data-testid="listing-catline" className="voeq-card-catline">
          <span className="voeq-card-catname">{categoryName ?? "Listing"}</span>
          <span aria-hidden className="voeq-card-catrule" />
        </div>
        <h3 data-testid="listing-title" className="voeq-card-title">
          {listing.title}
        </h3>
        {onVendor !== false && (
          <div className="voeq-card-vendor">
            {listing.verified && (
              <span data-testid="listing-vbadge" className="voeq-vbadge" aria-label="Verified vendor">✓</span>
            )}
            <span data-testid="listing-vendor-name">{listing.vendorName}</span>
          </div>
        )}

        <div className="voeq-card-foot">
          <span data-testid="listing-price" className="voeq-card-price">
            {formatPrice(listing.priceMinor)}
            {typeof listing.priceMaxMinor === "number" && listing.priceMaxMinor > listing.priceMinor ? (
              <small className="voeq-card-pricequal"> – {formatPrice(listing.priceMaxMinor)}</small>
            ) : null}
          </span>
          {typeof listing.vendorRatingAvg === "number" && (listing.vendorRatingCount ?? 0) > 0 ? (
            <span data-testid="listing-card-rating" className="voeq-card-stars">
              <span className="star">★</span> {listing.vendorRatingAvg.toFixed(1)}{" "}
              <span className="voeq-card-stars-n">({listing.vendorRatingCount})</span>
            </span>
          ) : (
            <span data-testid="listing-card-rating-empty" className="voeq-card-newpill">New</span>
          )}
        </div>
      </div>
      </article>
  );

  if (!link) return card;
  // CLICKABILITY FIX (2026-09-07): the card carries its own link so EVERY
  // surface (storefront grid, rails, cross-sells) is clickable out of the
  // box; external wrappers (Explore grid) pass link={false}.
  return (
    <Link
      href={`/listing/${listing.id}`}
      data-testid="listing-card-link"
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      {card}
    </Link>
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
