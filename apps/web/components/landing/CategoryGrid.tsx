"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  Grid3x3,
} from "lucide-react";
// BUNDLE FIX (2026-09-05): seed taxonomy from the pure-data submodule —
// root import ships drizzle + neon to the browser (see explore/Filters.tsx).
import { categories } from "@voeq/data/explore-view";
import type { VendorSummary } from "@voeq/data";

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

/**
 * CategoryGrid — landing "Browse by category".
 * Seeps REAL vendor data: fetches /api/vendors (real Neon in prod) and computes an
 * ACCURATE per-category vendor count. No hardcoded counts, no fake numbers. Falls back
 * to "0 to explore" honestly if the feed is empty so we never print a false count.
 */
export function CategoryGrid() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/vendors")
      .then((r) => (r.ok ? r.json() : Promise.resolve({ vendors: [] })))
      .then((d) => {
        if (cancelled) return;
        const vendors: VendorSummary[] = d.vendors ?? [];
        const perCat: Record<string, number> = {};
        for (const v of vendors) {
          const slug = v.categorySlug ?? v.category;
          if (slug) perCat[slug] = (perCat[slug] ?? 0) + 1;
        }
        setCounts(perCat);
      })
      .catch(() => {
        /* honest zero — never fake a count */
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = Object.values(counts).reduce((s, n) => s + n, 0);

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
          const count = counts[category.slug] ?? 0;

          return (
            <Link
              key={category.id}
              href={`/c/${category.slug}`}
              className="category-tile"
              style={{
                "--category-color": category.color,
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
                  {count > 0
                    ? `${count} vendor${count !== 1 ? "s" : ""}`
                    : loaded
                    ? total > 0
                      ? "0 to start"
                      : "—"
                    : "…"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
