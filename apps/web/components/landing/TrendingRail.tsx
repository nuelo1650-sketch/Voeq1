'use client';
import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ListingCard } from '@/components/explore/ListingCard';
import type { ExploreListing } from '@voeq/data';

type FilterTab = 'popular' | 'new' | 'topRated' | 'trending';

const filterTabs: { id: FilterTab; label: string; description: string }[] = [
  { id: 'popular', label: 'Popular on Voeq', description: 'Most relevant listings right now' },
  { id: 'new', label: 'New on Voeq', description: 'Recently posted listings' },
  { id: 'topRated', label: 'Top Rated', description: 'Highest rated vendors' },
  { id: 'trending', label: 'Trending Now', description: 'Featured by the Voeq team' },
];

/**
 * Landing TrendingRail — LISTINGS (2026-09-07, founder: "is it not supposed
 * to be only listings, why is a vendor profile showing on the landing
 * page"). The rail used to render VendorCard profiles; the landing's job is
 * to show what you can actually FIND on the marketplace, so it now renders
 * the same ListingCard as Explore (C1 design language) fed by the REAL
 * /api/explore feed (Neon in prod — no mock, no showcase fallback).
 *
 * Tabs map to honest API params: popular=relevance ranking, new=newest,
 * topRated=rating-desc, trending=featuredOnly (a real staff-curated signal,
 * not invented analytics).
 */
const TAB_PARAMS: Record<FilterTab, string> = {
  popular: 'sort=relevance',
  new: 'sort=newest',
  topRated: 'sort=rating-desc',
  trending: 'featuredOnly=true&sort=relevance',
};

export function TrendingRail() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('popular');
  const [isRotating, setIsRotating] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [listings, setListings] = useState<ExploreListing[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Fetch REAL listings for the active tab from /api/explore.
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    fetch(`/api/explore?${TAB_PARAMS[activeTab]}&limit=12`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setListings(Array.isArray(d?.data) ? d.data : []); })
      .catch(() => { /* honest empty state below */ })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [activeTab]);

  // Auto-rotation every 7 seconds
  useEffect(() => {
    if (!isRotating || isPaused || listings.length === 0) return;
    const id = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= max - 4) el.scrollTo({ left: 0, behavior: 'smooth' });
      else el.scrollBy({ left: el.clientWidth * 0.8, behavior: 'smooth' });
    }, 7000);
    return () => clearInterval(id);
  }, [isRotating, isPaused, listings.length]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.8 : el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const handleTabClick = (tab: FilterTab) => {
    setActiveTab(tab);
    setIsRotating(false);
    scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  return (
    <section 
      className="trending-rail-section"
      data-testid="landing-trending-rail"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="trending-rail-header">
        <div>
          <h2 className="trending-rail-title">Trending on campus</h2>
          <p className="trending-rail-subtitle">Real listings students are discovering right now</p>
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
          {listings.length > 0 ? (
            listings.map((l) => (
              <div key={l.id} className="trending-rail-item" style={{ flex: '0 0 240px' }}>
                <ListingCard listing={l} />
              </div>
            ))
          ) : (
            <div className="trending-rail-empty">
              <p>{loaded ? 'No listings in this feed yet — check back soon.' : 'Loading listings…'}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
