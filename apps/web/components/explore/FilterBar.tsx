'use client';
import { ChevronDown } from 'lucide-react';
import { categories } from '@voeq/data';

type StatusFilter = 'all' | 'open' | 'closing_soon' | 'closed';
type SortKey = 'relevance' | 'rating' | 'reviews' | 'newest' | 'price-asc' | 'price-desc';

interface FilterBarProps {
  selectedCategory: string;
  sortBy: SortKey;
  minRating: string;
  statusFilter: StatusFilter;
  verifiedOnly: boolean;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: SortKey) => void;
  onMinRatingChange: (rating: string) => void;
  onStatusChange: (status: StatusFilter) => void;
  onVerifiedChange: (verified: boolean) => void;
}

export function FilterBar({
  selectedCategory,
  sortBy,
  minRating,
  statusFilter,
  verifiedOnly,
  onCategoryChange,
  onSortChange,
  onMinRatingChange,
  onStatusChange,
  onVerifiedChange,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      {/* Category pills */}
      <div className="filter-categories">
        <button
          onClick={() => onCategoryChange('all')}
          className={`filter-category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.slug)}
            className={`filter-category-pill ${selectedCategory === cat.slug ? 'active' : ''}`}
            style={{ '--category-color': cat.color } as React.CSSProperties}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Advanced filters + sort */}
      <div className="filter-advanced">
        <label className="filter-select-group">
          <span className="filter-select-label">Min rating</span>
          <select
            value={minRating}
            onChange={(e) => onMinRatingChange(e.target.value)}
            className="filter-select"
          >
            <option value="any">Any</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="4.5">4.5+</option>
          </select>
        </label>

        <label className="filter-select-group">
          <span className="filter-select-label">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
            className="filter-select"
          >
            <option value="all">Any</option>
            <option value="open">Open now</option>
            <option value="closing_soon">Closing soon</option>
            <option value="closed">Closed</option>
          </select>
        </label>

        <label className="filter-checkbox-group">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => onVerifiedChange(e.target.checked)}
          />
          <span>Verified only</span>
        </label>

        <div className="filter-sort">
          <label htmlFor="sort-select" className="filter-select-label">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="filter-sort-select"
          >
            <option value="relevance">Relevance</option>
            <option value="rating">Highest Rated</option>
            <option value="reviews">Most Reviews</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
          <ChevronDown size={16} className="filter-sort-icon" />
        </div>
      </div>
    </div>
  );
}
