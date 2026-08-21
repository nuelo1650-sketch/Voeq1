'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { LiquidGlassPanel } from './LiquidGlassPanel';
import { CampusSelector } from './CampusSelector';
import { HeroVisual } from './HeroVisual';
import { categories, campuses } from '@voeq/data';

export function LandingHero() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCampus, setSelectedCampus] = useState(campuses[0].id);

  const handleSearch = () => {
    // TODO: Navigate to explore page with filters
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    if (selectedCampus) params.append('campus', selectedCampus);
    window.location.href = `/explore?${params.toString()}`;
  };

  return (
    <section className="hero-section">
      {/* Full-screen glass white background with animated moving dots */}
      <HeroVisual />

      {/* Content layer */}
      <div className="hero-content">
        {/* Campus selector in liquid glass panel (breathe duration: 11s) */}
        <LiquidGlassPanel breathDuration={11} delay={0}>
          <CampusSelector />
        </LiquidGlassPanel>

        {/* Main headline */}
        <h1 className="hero-headline">Find. Connect. Grow.</h1>
        <p className="hero-subheadline">The campus marketplace for Nigerian students</p>

        {/* Search bar in liquid glass panel (breathe duration: 14s, delay: 1s) */}
        <LiquidGlassPanel breathDuration={14} delay={1} className="hero-search-panel">
          <div className="hero-search-bar">
            <div className="hero-search-input-wrapper">
              <Search size={20} className="hero-search-icon" />
              <input 
                type="text"
                placeholder="What are you looking for?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hero-search-input"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="hero-search-select"
            >
              <option value="all">All categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
            
            <button 
              onClick={handleSearch}
              className="hero-search-btn"
            >
              Search
            </button>
          </div>
        </LiquidGlassPanel>

        {/* CTA buttons */}
        <div className="hero-ctas">
          <Link href="/explore" className="btn-primary btn-lg">
            Get Started
          </Link>
          <Link href="/for-vendors" className="btn-ghost btn-lg">
            Become a vendor
          </Link>
        </div>
      </div>
    </section>
  );
}
