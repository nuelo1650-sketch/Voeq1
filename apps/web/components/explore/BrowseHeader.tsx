'use client';
import { Search } from 'lucide-react';
import { campuses } from '@voeq/data';

interface BrowseHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
}

export function BrowseHeader({ searchQuery, onSearchChange, onSearch }: BrowseHeaderProps) {
  const defaultCampus = campuses.find(c => c.isDefault) || campuses[0];

  return (
    <div className="browse-header">
      <div className="browse-header-top">
        <div>
          <h1 className="browse-title">Explore</h1>
          <p className="browse-campus-indicator">
            Showing vendors on <strong>your campus</strong>
          </p>
        </div>
      </div>

      <div className="browse-search">
        <div className="browse-search-wrapper">
          <Search size={20} className="browse-search-icon" />
          <input
            type="text"
            placeholder="Search vendors, services..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="browse-search-input"
          />
        </div>
      </div>
    </div>
  );
}
