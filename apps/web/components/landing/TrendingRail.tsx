'use client';
import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VendorCard } from './VendorCard';
import type { VendorSummary } from '@voeq/data';

type FilterTab = 'popular' | 'new' | 'topRated' | 'trending';

const filterTabs = [
  { id: 'popular' as FilterTab, label: 'Popular on Voeq', description: 'Vendors with highest views' },
  { id: 'new' as FilterTab, label: 'New to Voeq', description: 'Recently added vendors' },
  { id: 'topRated' as FilterTab, label: 'Top Rated', description: 'Highest rated vendors' },
  { id: 'trending' as FilterTab, label: 'Trending Now', description: 'Recent activity spike' },
];

export function TrendingRail() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('popular');
  const [isRotating, setIsRotating] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  // F-A9: fetch REAL vendors from /api/vendors (Neon in prod, showcase in dev).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/vendors')
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setVendors(d.vendors ?? []); })
      .catch(() => { /* leave empty; honest empty state */ })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  // Auto-rotation every 7 seconds
  useEffect(() => {
    if (!isRotating || isPaused) return;

    const interval = setInterval(() => {
      setActiveTab(current => {
        const currentIndex = filterTabs.findIndex(tab => tab.id === current);
        const nextIndex = (currentIndex + 1) % filterTabs.length;
        return filterTabs[nextIndex].id;
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [isRotating, isPaused]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
    scrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
  };

  const handleTabClick = (tabId: FilterTab) => {
    setActiveTab(tabId);
    setIsRotating(false); // Stop rotation when user manually clicks
  };

  // Filter vendors based on active tab (real vendors rarely carry curated tags;
  // fall back to showing all when a tab has no matches so the rail is never empty).
  const filteredVendors = vendors.filter(vendor => vendor.tags.includes(activeTab));
  const displayVendors = filteredVendors.length > 0 ? filteredVendors : vendors;

  return (
    <section 
      className="trending-rail-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="trending-rail-header">
        <div>
          <h2 className="trending-rail-title">Trending on campus</h2>
          <p className="trending-rail-subtitle">Popular vendors students are discovering right now</p>
        </div>
        <div className="trending-rail-controls">
          <button 
            onClick={() => scroll('left')} 
            className="trending-rail-btn"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => scroll('right')} 
            className="trending-rail-btn"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="trending-rail-tabs">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`trending-rail-tab ${activeTab === tab.id ? 'active' : ''}`}
            aria-label={tab.description}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="trending-rail-scroll" ref={scrollRef}>
        <div className="trending-rail-content">
          {displayVendors.length > 0 ? (
            displayVendors.map((vendor) => (
              <div key={vendor.id} className="trending-rail-item">
                <VendorCard vendor={vendor} />
              </div>
            ))
          ) : (
            <div className="trending-rail-empty">
              <p>{loaded ? 'No vendors in this category yet.' : 'Loading vendors…'}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
