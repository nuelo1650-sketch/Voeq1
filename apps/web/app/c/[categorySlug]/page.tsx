'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrowseHeader } from '@/components/explore/BrowseHeader';
import { FilterBar } from '@/components/explore/FilterBar';
import { BrowseGrid } from '@/components/explore/BrowseGrid';
import { EmptyState } from '@/components/explore/EmptyState';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { vendors, categories, categoryNameFromSlug } from '@voeq/data';
import { use } from 'react';

/**
 * /c/[categorySlug] — Category-filtered browse page.
 * Pre-filters vendors by category from URL, otherwise identical to /explore.
 */
export default function CategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = use(params);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');

  // Find category for display
  const category = categories.find(c => c.slug === categorySlug);
  const categoryName = category?.name || categorySlug;

  // Filter vendors by this category
  const filteredVendors = useMemo(() => {
    let result = vendors.filter(v => 
      v.category.toLowerCase().replace(/\s+/g, '-') === categorySlug
    );

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.name.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        result = [...result].sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'newest':
        result = [...result].filter(v => v.tags.includes('new'));
        break;
      default:
        // relevance - keep original order
        break;
    }

    return result;
  }, [searchQuery, categorySlug, sortBy]);

  const handleSearch = () => {
    // Search is already applied via useMemo
  };

  return (
    <div className="explore-page">
      {/* Simple nav */}
      <nav className="explore-nav">
        <div className="explore-nav-content">
          <Link href="/" className="explore-logo">
            Voeq
          </Link>
          <Link href="/explore" className="explore-back">
            <ArrowLeft size={16} />
            <span>Back to explore</span>
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="explore-main">
        <div className="browse-header">
          <div className="browse-header-top">
            <div>
              <h1 className="browse-title">{categoryName}</h1>
              <p className="browse-campus-indicator">
                Browse all {categoryName.toLowerCase()} vendors
              </p>
            </div>
          </div>

          <div className="browse-search">
            <div className="browse-search-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="browse-search-icon">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="browse-search-input"
              />
            </div>
          </div>
        </div>

        {/* Sort only (category is pre-selected) */}
        <div className="filter-bar" style={{ justifyContent: 'flex-end' }}>
          <div className="filter-sort">
            <label htmlFor="sort-select" className="filter-sort-label">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-sort-select"
            >
              <option value="relevance">Relevance</option>
              <option value="rating">Highest Rated</option>
              <option value="reviews">Most Reviews</option>
              <option value="newest">Newest</option>
            </select>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="filter-sort-icon">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* Results */}
        <div className="explore-results">
          {filteredVendors.length > 0 ? (
            <>
              <p className="explore-results-count">
                {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} found
              </p>
              <BrowseGrid vendors={filteredVendors} />
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
