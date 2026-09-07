"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import type { VendorSummary } from '@voeq/data';
import { SaveButton } from '@/components/shopper/SaveButton';
import { FollowButton } from '@/components/shopper/FollowButton';

const RECENT_KEY = 'voeq:recentlyViewed';
const MAX_RECENT = 12;

function recordView(vendorId: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const ids: string[] = raw ? JSON.parse(raw).filter((x: unknown) => typeof x === 'string') : [];
    const next = [vendorId, ...ids.filter((id) => id !== vendorId)].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore storage errors */
  }
}

interface VendorCardProps {
  vendor: VendorSummary;
}

/**
 * Landing VendorCard — C1 WARM UPGRADE (2026-09-06, founder: "landing page
 * cards also need upgrading cause it has follow and some buttons that's not
 * rendering well"). The old card crammed a full-size Follow PILL (12px/24px
 * padding, 15px font) plus a heart into the photo corner — on the 260px rail
 * item they collided with the status badge and overflowed the image.
 *
 * Now: the same warm design language as the Explore ListingCard (cream
 * surface, amber eyebrow + hairline, serif name, serif rating footer) and the
 * actions become small frosted-glass ICON buttons top-right — heart + follow
 * (follow renders as a compact "+"/✓ glyph button, the pill is gone). Buttons
 * keep their own click isolation (preventDefault/stopPropagation) so tapping
 * them never navigates.
 */
export function VendorCard({ vendor }: VendorCardProps) {
  const statusLabel = {
    open: 'OPEN NOW',
    closing_soon: 'CLOSING SOON',
    closed: 'CLOSED',
  }[vendor.status];

  const statusColor = {
    open: 'var(--color-status-open)',
    closing_soon: 'var(--color-status-closing)',
    closed: 'var(--color-status-closed)',
  }[vendor.status];

  return (
    <article className="vendor-card voeq-warm-card" data-testid="landing-vendor-card">
      <Link
        href={`/vendor/${vendor.slug}`}
        className="vendor-card-link"
        onClick={() => recordView(vendor.id)}
      >
        <div className="vendor-card-photo">
          {vendor.photoUrl ? (
            <Image
              src={vendor.photoUrl}
              alt={vendor.name}
              fill
              className="vendor-photo"
              style={{ objectFit: 'cover', filter: 'saturate(0.95) contrast(1.05)' }}
            />
          ) : (
            /* Abstract placeholder with vendor initials + category color gradient */
            <div
              className="vendor-photo-placeholder"
              style={{
                background: `linear-gradient(180deg, ${vendor.categoryColor}1A 0%, ${vendor.categoryColor}4D 100%)`,
              }}
            >
              <span className="vendor-photo-initial" style={{ color: vendor.categoryColor }}>
                {vendor.name.charAt(0)}
              </span>
            </div>
          )}

          <span
            className="vendor-status"
            style={{ backgroundColor: statusColor }}
          >
            {statusLabel}
          </span>

          {/* C1: icon-only action buttons (heart + follow) — the old Follow
              PILL overflowed the 260px rail card. Compact glyph buttons ride a
              frosted pill so they stay legible on any photo. */}
          <div
            className="vendor-save"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <SaveButton targetType="vendor" targetId={vendor.id} className="vendor-icon-btn" compact />
            <FollowButton vendorId={vendor.id} className="vendor-follow-icon" compact />
          </div>
        </div>

        <div className="vendor-card-body">
          {/* C1 eyebrow: category + hairline (same DNA as Explore cards) */}
          <div className="voeq-card-catline">
            <span className="voeq-card-catname">{vendor.category}</span>
            <span className="voeq-card-catrule" aria-hidden />
          </div>
          <h3 className="vendor-name">{vendor.name}</h3>
          <div className="vendor-meta">
            <Star
              size={14}
              fill="var(--color-amber)"
              stroke="var(--color-amber)"
            />
            <span className="vendor-rating">{vendor.rating}</span>
            <span className="vendor-reviews">({vendor.reviewCount} {vendor.reviewCount === 1 ? 'review' : 'reviews'})</span>
            {vendor.priceRange && (
              <span className="vendor-price-inline">
                ₦{vendor.priceRange.min.toLocaleString()} – ₦{vendor.priceRange.max.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
