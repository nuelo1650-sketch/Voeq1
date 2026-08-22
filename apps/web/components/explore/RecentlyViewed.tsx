'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import type { VendorSummary } from '@voeq/data';
import { vendors } from '@voeq/data';
import { SaveButton } from '@/components/shopper/SaveButton';

const RECENT_KEY = 'voeq:recentlyViewed';

/** Read recently-viewed vendor ids from localStorage (real history, not a mock slice). */
function loadRecentIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

interface RecentlyViewedProps {
  /** Optional explicit list (used for SSR/empty); when omitted, reads real history. */
  vendors?: VendorSummary[];
}

export function RecentlyViewed({ vendors: propVendors }: RecentlyViewedProps) {
  const [recentVendors, setRecentVendors] = useState<VendorSummary[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load real recently-viewed history after mount (client-only).
  useEffect(() => {
    const ids = loadRecentIds();
    const byId = new Map(vendors.map((v) => [v.id, v]));
    const recent = ids.map((id) => byId.get(id)).filter((v): v is VendorSummary => Boolean(v));
    setRecentVendors(recent);
    setHydrated(true);
  }, []);

  const source = propVendors && propVendors.length > 0 ? propVendors : recentVendors;

  // Hidden when there is genuinely no history (and we've hydrated to avoid SSR flash).
  if ((!hydrated && (!propVendors || propVendors.length === 0)) || source.length === 0) {
    return null;
  }

  return (
    <section className="recently-viewed">
      <div className="recently-viewed-header">
        <h2 className="recently-viewed-title">Recently viewed</h2>
        <Link href="/explore?tab=recent" className="recently-viewed-see-all">
          See all
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="recently-viewed-rail">
        {source.map((vendor) => (
          <div key={vendor.id} className="recently-viewed-card">
            <Link href={`/vendor/${vendor.slug}`} className="recently-viewed-card-link">
              <div className="recently-viewed-card-photo">
                {vendor.photoUrl ? (
                  <Image
                    src={vendor.photoUrl}
                    alt={vendor.name}
                    fill
                    className="recently-viewed-image"
                  />
                ) : (
                  <div
                    className="recently-viewed-placeholder"
                    style={{
                      background: `linear-gradient(135deg, ${vendor.categoryColor}20 0%, ${vendor.categoryColor}40 100%)`,
                    }}
                  >
                    <span style={{ color: vendor.categoryColor, fontSize: '1.5rem', fontWeight: 600 }}>
                      {vendor.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="recently-viewed-card-body">
                <h3 className="recently-viewed-vendor-name">{vendor.name}</h3>
                <p className="recently-viewed-category">{vendor.category}</p>
              </div>
            </Link>

            <SaveButton targetType="vendor" targetId={vendor.id} className="recently-viewed-save" />
          </div>
        ))}
      </div>
    </section>
  );
}
