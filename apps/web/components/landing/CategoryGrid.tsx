import Link from 'next/link';
import { 
  Utensils, 
  Shirt, 
  Wrench, 
  Sparkles, 
  Book, 
  Printer, 
  Camera, 
  Scissors, 
  Truck, 
  Grid3x3 
} from 'lucide-react';
import { categories } from '@voeq/data';

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  utensils: Utensils,
  shirt: Shirt,
  wrench: Wrench,
  sparkles: Sparkles,
  book: Book,
  printer: Printer,
  camera: Camera,
  scissors: Scissors,
  truck: Truck,
  grid: Grid3x3,
};

export function CategoryGrid() {
  return (
    <section className="category-grid-section">
      <div className="category-grid-header">
        <h2 className="category-grid-title">Browse by category</h2>
        <p className="category-grid-subtitle">
          Explore verified vendors across campus services
        </p>
      </div>

      <div className="category-grid">
        {categories.map((category) => {
          const Icon = iconMap[category.icon] || Grid3x3;
          
          return (
            <Link 
              key={category.id} 
              href={`/c/${category.slug}`}
              className="category-tile"
              style={{
                '--category-color': category.color,
                background: `linear-gradient(135deg, ${category.color}1A 0%, ${category.color}33 100%)`,
              } as React.CSSProperties}
            >
              <div 
                className="category-tile-icon"
                style={{ backgroundColor: category.color }}
              >
                <Icon size={48} />
              </div>
              <div className="category-tile-content">
                <h3 className="category-tile-name">{category.name}</h3>
                <p className="category-tile-count">
                  {category.vendorCount > 0 
                    ? `${category.vendorCount} vendor${category.vendorCount !== 1 ? 's' : ''}`
                    : '—'
                  }
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
