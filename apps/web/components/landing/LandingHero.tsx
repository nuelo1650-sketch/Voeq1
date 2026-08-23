'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { LiquidGlassPanel } from './LiquidGlassPanel';
import { HeroVisual } from './HeroVisual';
import { categories } from '@voeq/data';

export function LandingHero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('q', searchQuery);
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    
    const queryString = params.toString();
    router.push(queryString ? `/explore?${queryString}` : '/explore');
  };

  return (
    <section className="hero-section">
      {/* Full-screen glass white background with animated moving dots */}
      <HeroVisual />

      {/* Content layer */}
      <div className="hero-content">
        {/* Voeq wordmark above headline */}
        <div style={{
          fontFamily: "var(--role-font-display)",
          fontSize: "clamp(2rem, 5vw, 3rem)",
          fontWeight: 600,
          color: "var(--color-forest)",
          marginBottom: "var(--space-2)",
          letterSpacing: "0.02em",
        }}>
          Voeq
        </div>
        
        {/* Main headline */}
        <h1 className="hero-headline">Find. Connect. Grow.</h1>
        <p className="hero-subheadline">The campus marketplace for Nigerian students</p>

        {/* Search bar in liquid glass panel (breathe duration: 14s, delay: 1s) */}
        <LiquidGlassPanel breathDuration={14} delay={1} className="hero-search-panel">
          <form onSubmit={handleSearch} className="hero-search-bar">
            <div className="hero-search-input-wrapper">
              <Search size={20} className="hero-search-icon" />
              <input 
                type="text"
                placeholder="What are you looking for?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hero-search-input"
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
              type="submit"
              className="hero-search-btn"
            >
              Search
            </button>
          </form>
        </LiquidGlassPanel>

        {/* CTA buttons */}
        <div className="hero-ctas">
          <Link href="/explore" className="btn-primary btn-lg">
            Explore
          </Link>
          <Link href="/for-vendors" className="btn-ghost btn-lg">
            Become a vendor
          </Link>
        </div>
      </div>
    </section>
  );
}
