"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star } from 'lucide-react';
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
    <article className="vendor-card">
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
            className="vendor-category-badge" 
            style={{ backgroundColor: vendor.categoryColor }}
          >
            {vendor.category}
          </span>
          
          <span 
            className="vendor-status" 
            style={{ backgroundColor: statusColor }}
          >
            {statusLabel}
          </span>
          
          <div
            className="vendor-save"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <SaveButton targetType="vendor" targetId={vendor.id} />
            <FollowButton vendorId={vendor.id} className="vendor-follow" />
          </div>
        </div>
        
        <div className="vendor-card-body">
          <h3 className="vendor-name">{vendor.name}</h3>
          <p className="vendor-category">{vendor.category}</p>
          <div className="vendor-meta">
            <Star 
              size={14} 
              fill="var(--color-amber)" 
              stroke="var(--color-amber)" 
            />
            <span className="vendor-rating">{vendor.rating}</span>
            <span className="vendor-reviews">({vendor.reviewCount} reviews)</span>
          </div>
          {vendor.priceRange && (
            <p className="vendor-price">
              ₦{vendor.priceRange.min.toLocaleString()} – ₦{vendor.priceRange.max.toLocaleString()}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
