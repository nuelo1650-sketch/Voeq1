import Link from 'next/link';
import { categories } from '@voeq/data';
import type { VendorSummary } from '@voeq/data';

interface CategoriesGridProps {
  vendors: VendorSummary[];
}

export function CategoriesGrid({ vendors }: CategoriesGridProps) {
  // Count vendors per category
  const categoryCounts = categories.map(category => {
    const count = vendors.filter(v => 
      v.category.toLowerCase().replace(/\s+/g, '-') === category.slug
    ).length;
    return { ...category, count };
  });

  return (
    <section className="categories-grid-section">
      <h2 className="categories-grid-title">Browse by category</h2>
      
      <div className="categories-grid">
        {categoryCounts.map((category) => (
          <Link
            key={category.id}
            href={`/c/${category.slug}`}
            className="category-grid-tile"
            style={{
              '--category-color': category.color,
            } as React.CSSProperties}
          >
            <div 
              className="category-grid-bg"
              style={{
                background: `linear-gradient(135deg, ${category.color}10 0%, ${category.color}30 100%)`,
              }}
            />
            
            <div 
              className="category-grid-icon"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <span style={{ fontSize: '24px' }}>{category.icon}</span>
            </div>
            
            <h3 className="category-grid-name">{category.name}</h3>
            <p className="category-grid-count">
              {category.count > 0 ? `${category.count} vendor${category.count !== 1 ? 's' : ''}` : '—'}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
