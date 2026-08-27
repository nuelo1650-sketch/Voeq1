'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, UtensilsCrossed, Shirt, Laptop, Sparkles, BookOpen } from 'lucide-react';
import { LiquidGlassPanel } from './LiquidGlassPanel';
import { HeroVisual } from './HeroVisual';
import { BrandLogo } from './BrandLogo';
import { categories } from '@voeq/data';

const CAT_ICONS: Record<string, React.ReactNode> = {
  'food-drinks': <UtensilsCrossed size={16} />,
  'fashion': <Shirt size={16} />,
  'tech-repairs': <Laptop size={16} />,
  'beauty-care': <Sparkles size={16} />,
  'academic-services': <BookOpen size={16} />,
};

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
        {/* Voeq wordmark above headline — sized to match Find. Connect. Grow. */}
        <div
          className="hero-wordmark"
          style={{
            marginBottom: "var(--space-3)",
            lineHeight: 1,
          }}
        >
          <BrandLogo width={180} />
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

        {/* Popular category chips */}
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: 8, 
          justifyContent: "center",
          marginTop: "var(--space-3)",
          marginBottom: "var(--space-4)",
        }}>
          <span style={{ 
            fontSize: 13, 
            color: "var(--color-ink-muted)", 
            marginRight: 4,
            alignSelf: "center",
          }}>
            Popular:
          </span>
          {[
            { iconKey: 'food-drinks', name: 'Food', slug: 'food-drinks' },
            { iconKey: 'fashion', name: 'Fashion', slug: 'fashion' },
            { iconKey: 'tech-repairs', name: 'Tech Repair', slug: 'tech-repairs' },
            { iconKey: 'beauty-care', name: 'Beauty', slug: 'beauty-care' },
            { iconKey: 'academic-services', name: 'Academic', slug: 'academic-services' },
          ].map((cat) => (
            <Link
              key={cat.slug}
              href={`/explore?category=${cat.slug}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                background: "var(--glass-bg)",
                backdropFilter: "var(--glass-blur)",
                WebkitBackdropFilter: "var(--glass-blur)",
                border: "1px solid var(--glass-border)",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 500,
                color: "var(--color-ink-deep)",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-cream)";
                e.currentTarget.style.borderColor = "var(--color-forest)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--glass-bg)";
                e.currentTarget.style.borderColor = "var(--glass-border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span style={{ color: "var(--color-forest)", display: "inline-flex", alignItems: "center" }}>{CAT_ICONS[cat.iconKey]}</span>
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>

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
