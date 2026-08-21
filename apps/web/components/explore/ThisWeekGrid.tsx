import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, MessageCircle } from 'lucide-react';
import type { VendorSummary } from '@voeq/data';

interface ThisWeekGridProps {
  vendors: VendorSummary[];
}

export function ThisWeekGrid({ vendors }: ThisWeekGridProps) {
  return (
    <section className="this-week-section">
      <div className="this-week-header">
        <h2 className="this-week-title">On Voeq this week</h2>
        <Link href="/explore?tab=popular" className="this-week-see-all">
          See all
        </Link>
      </div>

      <div className="this-week-grid">
        {vendors.slice(0, 12).map((vendor, index) => {
          // Vary card styling for visual interest (avoid monotony)
          const isFeatured = index === 0 || index === 5;
          const statusLabel = {
            open: 'OPEN NOW',
            closing_soon: 'CLOSING SOON',
            closed: 'CLOSED',
          }[vendor.status];

          return (
            <article 
              key={vendor.id} 
              className={`this-week-card ${isFeatured ? 'featured' : ''}`}
            >
              <Link href={`/vendor/${vendor.slug}`} className="this-week-card-link">
                <div className="this-week-card-photo">
                  {vendor.photoUrl ? (
                    <Image
                      src={vendor.photoUrl}
                      alt={vendor.name}
                      fill
                      className="this-week-image"
                    />
                  ) : (
                    <div 
                      className="this-week-placeholder"
                      style={{
                        background: `linear-gradient(135deg, ${vendor.categoryColor}20 0%, ${vendor.categoryColor}50 100%)`,
                      }}
                    >
                      <span 
                        className="this-week-initial"
                        style={{ color: vendor.categoryColor }}
                      >
                        {vendor.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div className="this-week-badges">
                    {(() => {
                      const deal = vendor.tags.includes('topRated')
                        ? 'Top Pick'
                        : vendor.tags.includes('trending')
                          ? 'Trending'
                          : vendor.tags.includes('new')
                            ? 'New'
                            : vendor.tags.includes('popular')
                              ? 'Popular'
                              : null;
                      return deal ? (
                        <span className="this-week-deal-badge">{deal}</span>
                      ) : null;
                    })()}
                    <span
                      className="this-week-category-badge"
                      style={{ backgroundColor: vendor.categoryColor }}
                    >
                      {vendor.category}
                    </span>
                    <span className={`this-week-status status-${vendor.status}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <button 
                    className="this-week-save"
                    onClick={(e) => {
                      e.preventDefault();
                      // TODO: implement save
                    }}
                    aria-label={`Save ${vendor.name}`}
                  >
                    <Heart size={16} />
                  </button>
                </div>

                <div className="this-week-card-body">
                  <h3 className="this-week-vendor-name">{vendor.name}</h3>
                  <p className="this-week-category">{vendor.category}</p>
                  
                  <div className="this-week-meta">
                    <Star size={14} fill="var(--color-amber)" stroke="var(--color-amber)" />
                    <span className="this-week-rating">{vendor.rating}</span>
                    <span className="this-week-reviews">({vendor.reviewCount})</span>
                  </div>

                  {vendor.priceRange && (
                    <p className="this-week-price">
                      ₦{vendor.priceRange.min.toLocaleString()} – ₦{vendor.priceRange.max.toLocaleString()}
                    </p>
                  )}

                  {isFeatured && (
                    <button 
                      className="this-week-message-cta"
                      onClick={(e) => {
                        e.preventDefault();
                        // TODO: open message composer
                      }}
                    >
                      <MessageCircle size={14} />
                      Message
                    </button>
                  )}
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
