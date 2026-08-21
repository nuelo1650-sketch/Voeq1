import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import type { VendorSummary } from '@voeq/data';

interface FeaturedVendorsProps {
  largeVendor: VendorSummary;
  smallVendor: VendorSummary;
}

export function FeaturedVendors({ largeVendor, smallVendor }: FeaturedVendorsProps) {
  return (
    <section className="featured-vendors">
      <div className="featured-vendors-grid">
        {/* Large featured vendor */}
        <Link href={`/vendor/${largeVendor.slug}`} className="featured-vendor-card featured-vendor-large">
          <div className="featured-vendor-bg">
            {largeVendor.photoUrl ? (
              <Image
                src={largeVendor.photoUrl}
                alt={largeVendor.name}
                fill
                className="featured-vendor-image"
              />
            ) : (
              <div 
                className="featured-vendor-gradient"
                style={{
                  background: `linear-gradient(135deg, ${largeVendor.categoryColor}40 0%, ${largeVendor.categoryColor}80 100%)`,
                }}
              />
            )}
            <div className="featured-vendor-overlay" />
          </div>

          <div className="featured-vendor-badges">
            <span 
              className="featured-category-badge"
              style={{ backgroundColor: largeVendor.categoryColor }}
            >
              {largeVendor.category}
            </span>
            <span className={`featured-status-badge status-${largeVendor.status}`}>
              {largeVendor.status === 'open' ? 'OPEN NOW' : 
               largeVendor.status === 'closing_soon' ? 'CLOSING SOON' : 'CLOSED'}
            </span>
          </div>

          <div className="featured-vendor-content">
            <h3 className="featured-vendor-name">{largeVendor.name}</h3>
            <div className="featured-vendor-meta">
              <Star size={16} fill="var(--color-amber)" stroke="var(--color-amber)" />
              <span>{largeVendor.rating}</span>
              <span className="featured-vendor-reviews">({largeVendor.reviewCount} reviews)</span>
            </div>
            {largeVendor.priceRange && (
              <p className="featured-vendor-price">
                ₦{largeVendor.priceRange.min.toLocaleString()} – ₦{largeVendor.priceRange.max.toLocaleString()}
              </p>
            )}
            <button className="featured-vendor-cta">View vendor</button>
          </div>
        </Link>

        {/* Small featured vendor */}
        <Link href={`/vendor/${smallVendor.slug}`} className="featured-vendor-card featured-vendor-small">
          <div className="featured-vendor-bg">
            {smallVendor.photoUrl ? (
              <Image
                src={smallVendor.photoUrl}
                alt={smallVendor.name}
                fill
                className="featured-vendor-image"
              />
            ) : (
              <div 
                className="featured-vendor-gradient"
                style={{
                  background: `linear-gradient(135deg, ${smallVendor.categoryColor}40 0%, ${smallVendor.categoryColor}80 100%)`,
                }}
              />
            )}
            <div className="featured-vendor-overlay" />
          </div>

          <div className="featured-vendor-badges">
            <span 
              className="featured-category-badge"
              style={{ backgroundColor: smallVendor.categoryColor }}
            >
              {smallVendor.category}
            </span>
          </div>

          <div className="featured-vendor-content">
            <h3 className="featured-vendor-name">{smallVendor.name}</h3>
            <div className="featured-vendor-meta">
              <Star size={14} fill="var(--color-amber)" stroke="var(--color-amber)" />
              <span>{smallVendor.rating}</span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
