'use client';
import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import { Explore } from '@/components/explore/Explore';
import { CATEGORIES } from '@/components/explore/Filters';

/**
 * /c/[categorySlug] — Category browse (K2.2). Uses the SINGLE discover surface (Explore)
 * with a category preset so filters/sort/search all run through loadExplore. Enhanced with
 * category hero, breadcrumb, and related categories per KIRO-2 brief.
 */
export default function CategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = use(params);
  
  const category = CATEGORIES.find(c => c.slug === categorySlug);
  const categoryName = category?.label ?? categorySlug;
  
  // Category descriptions
  const categoryDescriptions: Record<string, string> = {
    food: "From late-night snacks to full meals, find food vendors trusted by students on your campus.",
    books: "Textbooks, novels, and study materials from verified student sellers.",
    beauty: "Beauty products, hair care, and grooming services available near you.",
    apparel: "Fashion, clothing, and accessories from campus vendors.",
    services: "Print shops, tutoring, repairs, and other services students need.",
  };
  
  const description = categoryDescriptions[categorySlug] ?? `Vendors offering ${categoryName.toLowerCase()} on your campus`;
  
  // Related categories (exclude current)
  const relatedCategories = CATEGORIES.filter(c => c.slug !== categorySlug).slice(0, 4);
  
  // Category color mapping (from design system)
  const categoryColors: Record<string, string> = {
    food: "#E8A33D", // amber
    books: "#2D5A3D", // forest-mid
    beauty: "#D4922A", // amber-dark
    apparel: "#4A7A5C", // forest-light
    services: "#0F2A1D", // forest
  };
  
  const categoryColor = categoryColors[categorySlug] ?? "#2D5A3D";

  return (
    <div className="explore-page">
      <nav className="explore-nav">
        <div className="explore-nav-content">
          <Link href="/" className="explore-logo">Voeq</Link>
          <Link href="/explore" className="explore-back">
            <ArrowLeft size={16} />
            <span>Back to explore</span>
          </Link>
        </div>
      </nav>
      
      {/* Breadcrumb */}
      <div style={{ 
        padding: "var(--space-2) var(--nav-inline-pad)", 
        borderBottom: "1px solid var(--role-border)",
        background: "var(--role-surface)",
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          fontSize: "14px",
          color: "var(--role-text-muted)",
          fontFamily: "var(--role-font-ui)",
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--role-text-muted)", textDecoration: "none" }}>
            <Home size={14} />
            <span>Home</span>
          </Link>
          <span>›</span>
          <Link href="/explore" style={{ color: "var(--role-text-muted)", textDecoration: "none" }}>
            Explore
          </Link>
          <span>›</span>
          <span style={{ color: "var(--role-text)", fontWeight: 600 }}>{categoryName}</span>
        </div>
      </div>
      
      {/* Category Hero */}
      <div style={{ 
        padding: "var(--space-6) var(--nav-inline-pad)",
        background: "var(--role-surface)",
        borderBottom: "1px solid var(--role-border)",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          {/* Category icon/badge */}
          <div style={{
            width: 80,
            height: 80,
            margin: "0 auto var(--space-3)",
            borderRadius: "var(--radius-lg)",
            background: `linear-gradient(135deg, ${categoryColor}20, ${categoryColor}40)`,
            border: `2px solid ${categoryColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <span style={{ fontSize: 36 }}>
              {categorySlug === 'food' && '🍕'}
              {categorySlug === 'books' && '📚'}
              {categorySlug === 'beauty' && '💄'}
              {categorySlug === 'apparel' && '👕'}
              {categorySlug === 'services' && '🔧'}
            </span>
          </div>
          
          <h1 style={{ 
            fontSize: "clamp(32px, 5vw, 48px)", 
            fontWeight: 600, 
            margin: "0 0 var(--space-2)", 
            fontFamily: "var(--role-font-display)",
            color: "var(--role-text)",
          }}>
            {categoryName}
          </h1>
          
          <p style={{ 
            fontSize: "18px", 
            color: "var(--role-text-muted)", 
            margin: 0,
            fontFamily: "var(--role-font-ui)",
            lineHeight: 1.6,
          }}>
            {description}
          </p>
        </div>
      </div>
      
      <Explore categoryPreset={categorySlug} />
      
      {/* Related Categories */}
      {relatedCategories.length > 0 && (
        <div style={{ 
          padding: "var(--space-6) var(--nav-inline-pad)",
          background: "var(--role-surface)",
          borderTop: "1px solid var(--role-border)",
        }}>
          <h2 style={{ 
            fontSize: "24px", 
            fontWeight: 600, 
            margin: "0 0 var(--space-4)", 
            fontFamily: "var(--role-font-display)",
            color: "var(--role-text)",
          }}>
            Related categories
          </h2>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
            gap: "var(--space-3)",
          }}>
            {relatedCategories.map((cat) => {
              const color = categoryColors[cat.slug] ?? "#2D5A3D";
              return (
                <Link
                  key={cat.slug}
                  href={`/c/${cat.slug}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    padding: "var(--space-4)",
                    background: "var(--role-surface)",
                    border: "1px solid var(--role-border)",
                    borderRadius: "var(--radius-lg)",
                    transition: "transform 120ms ease, box-shadow 120ms ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    marginBottom: "var(--space-2)",
                    borderRadius: "var(--radius-md)",
                    background: `linear-gradient(135deg, ${color}20, ${color}40)`,
                    border: `1px solid ${color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                  }}>
                    {cat.slug === 'food' && '🍕'}
                    {cat.slug === 'books' && '📚'}
                    {cat.slug === 'beauty' && '💄'}
                    {cat.slug === 'apparel' && '👕'}
                    {cat.slug === 'services' && '🔧'}
                  </div>
                  <h3 style={{ 
                    fontSize: "18px", 
                    fontWeight: 600, 
                    margin: "0 0 4px", 
                    fontFamily: "var(--role-font-display)",
                    color: "var(--role-text)",
                  }}>
                    {cat.label}
                  </h3>
                  <p style={{ 
                    fontSize: "14px", 
                    color: "var(--role-text-muted)", 
                    margin: 0,
                    fontFamily: "var(--role-font-ui)",
                  }}>
                    Explore {cat.label.toLowerCase()}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
