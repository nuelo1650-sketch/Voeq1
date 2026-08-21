'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrowseHeader } from '@/components/explore/BrowseHeader';
import { ExploreTabs } from '@/components/explore/ExploreTabs';
import { FeaturedVendors } from '@/components/explore/FeaturedVendors';
import { RecentlyViewed } from '@/components/explore/RecentlyViewed';
import { CategoriesGrid } from '@/components/explore/CategoriesGrid';
import { ThisWeekGrid } from '@/components/explore/ThisWeekGrid';
import { FilterBar } from '@/components/explore/FilterBar';
import { BrowseGrid } from '@/components/explore/BrowseGrid';
import { EmptyState } from '@/components/explore/EmptyState';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { vendors, type VendorSummary } from '@voeq/data';
import { useSearchParams, useRouter } from 'next/navigation';

type StatusFilter = 'all' | 'open' | 'closing_soon' | 'closed';
type SortKey = 'relevance' | 'rating' | 'reviews' | 'newest' | 'price-asc' | 'price-desc';

function readInitial<T extends string>(params: URLSearchParams, key: string, fallback: T): T {
  const v = params.get(key);
  return (v ?? fallback) as T;
}

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState<string>(() => searchParams.get('q') ?? '');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => readInitial(searchParams, 'category', 'all'));
  const [sortBy, setSortBy] = useState<SortKey>(() => readInitial<SortKey>(searchParams, 'sort', 'relevance'));
  const [activeTab, setActiveTab] = useState<string>(() => readInitial(searchParams, 'tab', 'popular'));
  const [minRating, setMinRating] = useState<string>(() => readInitial(searchParams, 'minRating', 'any'));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => readInitial<StatusFilter>(searchParams, 'status', 'all'));
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(() => searchParams.get('verified') === '1');

  // Tab predicate (per PG-PUB-002 + brief): popular/new/top-rated/trending/verified.
  const tabFilteredVendors = useMemo(() => {
    switch (activeTab) {
      case 'new':
        return vendors.filter((v) => v.tags.includes('new'));
      case 'top-rated':
        return vendors.filter((v) => v.rating >= 4.5);
      case 'trending':
        return vendors.filter((v) => v.tags.includes('trending'));
      case 'verified':
        return vendors.filter((v) => v.tags.includes('topRated'));
      case 'popular':
      default:
        return vendors.filter((v) => v.tags.includes('popular') || v.tags.includes('topRated'));
    }
  }, [activeTab]);

  // Full filter + sort (URL-driven, reload-safe).
  const filteredVendors = useMemo(() => {
    let result = tabFilteredVendors;

    if (selectedCategory !== 'all') {
      result = result.filter((v) => v.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (v) => v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q),
      );
    }

    if (minRating !== 'any') {
      const min = Number(minRating);
      result = result.filter((v) => v.rating >= min);
    }

    if (statusFilter !== 'all') {
      result = result.filter((v) => v.status === statusFilter);
    }

    if (verifiedOnly) {
      result = result.filter((v) => v.tags.includes('topRated'));
    }

    // Sort (stable). "newest" floats `new`-tagged vendors to the top without
    // dropping the rest (no date field yet — honest stand-in for a real recency sort).
    const arr = [...result];
    switch (sortBy) {
      case 'rating':
        arr.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        arr.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'price-asc':
        arr.sort((a, b) => (a.priceRange?.min ?? 0) - (b.priceRange?.min ?? 0));
        break;
      case 'price-desc':
        arr.sort((a, b) => (b.priceRange?.min ?? 0) - (a.priceRange?.min ?? 0));
        break;
      case 'newest':
        arr.sort((a, b) => Number(b.tags.includes('new')) - Number(a.tags.includes('new')));
        break;
      default:
        // relevance — keep order
        break;
    }
    return arr;
  }, [tabFilteredVendors, selectedCategory, searchQuery, minRating, statusFilter, verifiedOnly, sortBy]);

  // Sync state → URL (reload-safe, shareable). Debounced for the search box.
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'popular') params.set('tab', activeTab);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    if (minRating !== 'any') params.set('minRating', minRating);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (verifiedOnly) params.set('verified', '1');
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : '/explore', { scroll: false });
  }, [activeTab, selectedCategory, searchQuery, sortBy, minRating, statusFilter, verifiedOnly, router]);

  const handleSearch = () => {
    // Search is applied live via useMemo; this is the Enter-key hook.
  };

  const featuredLarge = vendors.find((v) => v.tags.includes('topRated') && v.rating >= 4.8) || vendors[0];
  const featuredSmall = vendors.find((v) => v.tags.includes('popular') && v.id !== featuredLarge.id) || vendors[1];

  return (
    <div className="explore-page">
      <nav className="explore-nav">
        <div className="explore-nav-content">
          <Link href="/" className="explore-logo">
            Voeq
          </Link>
          <Link href="/" className="explore-back">
            <ArrowLeft size={16} />
            <span>Back to home</span>
          </Link>
        </div>
      </nav>

      <main className="explore-main">
        <BrowseHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} onSearch={handleSearch} />

        <ExploreTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <FeaturedVendors largeVendor={featuredLarge} smallVendor={featuredSmall} />

        <RecentlyViewed />

        <CategoriesGrid vendors={vendors} />

        <ThisWeekGrid vendors={tabFilteredVendors.slice(0, 12)} />

        <FilterBar
          selectedCategory={selectedCategory}
          sortBy={sortBy}
          minRating={minRating}
          statusFilter={statusFilter}
          verifiedOnly={verifiedOnly}
          onCategoryChange={setSelectedCategory}
          onSortChange={setSortBy}
          onMinRatingChange={setMinRating}
          onStatusChange={setStatusFilter}
          onVerifiedChange={setVerifiedOnly}
        />

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
