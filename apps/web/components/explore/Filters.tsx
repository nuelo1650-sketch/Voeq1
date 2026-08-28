"use client";

import { useMemo } from "react";
import type { ExploreFilters, ExploreListing } from "@voeq/data";
import { PriceRangeSlider } from "./PriceRangeSlider";

export const CATEGORIES = [
  { slug: "food", label: "Food & Drinks" },
  { slug: "books", label: "Academic" },
  { slug: "beauty", label: "Beauty & Wellness" },
  { slug: "apparel", label: "Fashion" },
  { slug: "services", label: "Services" },
  { slug: "tech", label: "Tech & Electronics" },
  { slug: "printing", label: "Printing & Copy" },
];

const SORTS = [
  { value: "relevance", label: "Most popular" },
  { value: "distance", label: "Distance (nearest first)" },
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Top rated" },
] as const;

/**
 * Filters — modernized filter sidebar for campus marketplace.
 * Genuine, student-relevant filters only. Clean, modern styling.
 */
export function Filters({
  value,
  onChange,
  presetCategory,
  listings,
}: {
  value: ExploreFilters;
  onChange: (next: ExploreFilters) => void;
  presetCategory?: string;
  listings?: ExploreListing[];
}) {
  const set = (patch: Partial<ExploreFilters>) => onChange({ ...value, ...patch });

  // Compute price histogram from unfiltered data
  const priceStats = useMemo(() => {
    if (!listings?.length) return null;
    const prices = listings.map((l) => l.priceMinor);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max, prices };
  }, [listings]);

  return (
    <div data-testid="explore-filters" style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: "var(--space-4)",
      background: "var(--color-cream)",
      border: "1px solid var(--color-ink-subtle)",
      borderRadius: 12,
      padding: "var(--space-3)",
    }}>
      <h3 style={{ 
        fontFamily: "var(--font-display)", 
        fontSize: 18, 
        margin: 0, 
        color: "var(--color-forest)",
        paddingBottom: "var(--space-2)",
        borderBottom: "1px solid var(--color-ink-subtle)",
      }}>
        Filters
      </h3>

      {/* Category */}
      <Field label="Category">
        <select
          data-testid="filter-category"
          value={presetCategory ?? value.category ?? ""}
          disabled={!!presetCategory}
          onChange={(e) => set({ category: e.target.value || undefined })}
          style={modernSelectStyle}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
        </select>
      </Field>

      {/* Sort */}
      <Field label="Sort by">
        <select
          data-testid="filter-sort"
          value={value.sort ?? "relevance"}
          onChange={(e) => set({ sort: e.target.value as ExploreFilters["sort"] })}
          style={modernSelectStyle}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </Field>

      {/* Price range */}
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ 
          fontSize: 14, 
          fontWeight: 600,
          color: "var(--color-forest)", 
          fontFamily: "var(--font-body)", 
          marginBottom: 8 
        }}>
          Price range (₦)
        </legend>
        {priceStats && (
          <PriceRangeSlider
            min={priceStats.min}
            max={priceStats.max}
            valueMin={value.minPrice}
            valueMax={value.maxPrice}
            onChange={(min, max) => set({ minPrice: min, maxPrice: max })}
            histogram={Array(12).fill(0).map((_, i) => {
              const bucketMin = priceStats.min + (i / 12) * (priceStats.max - priceStats.min);
              const bucketMax = priceStats.min + ((i + 1) / 12) * (priceStats.max - priceStats.min);
              return priceStats.prices.filter((p) => p >= bucketMin && p < bucketMax).length;
            })}
          />
        )}
        {(value.minPrice || value.maxPrice) && (
          <p style={{ fontSize: 12, color: "var(--color-forest-mid)", margin: 0, marginTop: 6 }}>
            {value.minPrice && value.maxPrice 
              ? `₦${value.minPrice / 100} – ₦${value.maxPrice / 100}`
              : value.minPrice 
              ? `From ₦${value.minPrice / 100}`
              : value.maxPrice
              ? `Up to ₦${value.maxPrice / 100}`
              : ""}
          </p>
        )}
      </fieldset>

      {/* Minimum rating */}
      <Field label="Minimum rating">
        <select
          data-testid="filter-min-rating"
          value={value.minRating ?? ""}
          onChange={(e) => set({ minRating: e.target.value ? Number(e.target.value) : undefined })}
          style={modernSelectStyle}
        >
          <option value="">Any rating</option>
          <option value="3">⭐ 3+ stars</option>
          <option value="4">⭐ 4+ stars</option>
          <option value="4.5">⭐ 4.5+ stars</option>
        </select>
      </Field>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--color-ink-subtle)", margin: 0 }} />

      {/* Quick filters — pill toggles (PassA-6) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ 
          fontSize: 12, 
          fontWeight: 600, 
          color: "var(--color-ink-muted)", 
          textTransform: "uppercase", 
          letterSpacing: "0.5px",
          margin: 0,
        }}>
          Quick filters
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(
            [
              { key: "openNow", testid: "filter-open-now-pill", label: "Open now" },
              { key: "hasPhotos", testid: "filter-has-photos-pill", label: "Has photos" },
            ] as const
          ).map(({ key, testid, label }) => {
            const active = !!value[key];
            return (
              <button
                key={key}
                data-testid={testid}
                aria-pressed={active}
                onClick={() => set({ [key]: active ? undefined : true } as Partial<ExploreFilters>)}
                style={{
                  ...quickPillStyle,
                  ...(active ? quickPillActiveStyle : {}),
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear all button */}
      {(value.category || value.minPrice || value.maxPrice || value.minRating || value.openNow || value.hasPhotos) && (
        <button
          onClick={() => onChange({})}
          style={{
            padding: "10px",
            background: "transparent",
            color: "var(--color-ink-muted)",
            border: "1px solid var(--color-ink-subtle)",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            marginTop: "var(--space-2)",
          }}
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: 8, 
      fontSize: 14, 
      fontWeight: 600,
      color: "var(--color-forest)", 
      fontFamily: "var(--font-body)" 
    }}>
      {label}
      {children}
    </label>
  );
}

const modernSelectStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--color-ink-subtle)",
  background: "var(--color-glass-white)",
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  cursor: "pointer",
};

const modernInputStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--color-ink-subtle)",
  background: "var(--color-glass-white)",
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
};

const modernCheckStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  fontSize: 14,
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  cursor: "pointer",
  padding: "6px 0",
};

const checkboxStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  cursor: "pointer",
};

// PassA-6: quick-filter pill toggles (match category pill visual language)
const quickPillStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "13px",
  fontWeight: 500,
  padding: "6px 14px",
  borderRadius: 999,
  border: "1px solid var(--color-ink-subtle)",
  background: "var(--color-glass-white)",
  color: "var(--color-ink)",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "all 120ms ease",
};

const quickPillActiveStyle: React.CSSProperties = {
  background: "var(--color-forest)",
  color: "var(--color-glass-white)",
  borderColor: "var(--color-forest)",
};
