"use client";

import { useMemo } from "react";
import type { ExploreFilters, ExploreListing } from "@voeq/data";
import { PriceRangeSlider } from "./PriceRangeSlider";

import { categories } from "@voeq/data";

/** P3 (2026-08-29): Explore category keys derive from the canonical categories
 * taxonomy (@voeq/data) so the filter slug matches a real listing's categorySlug.
 * Previously this was a hardcoded list with slugs ("food","tech") that DON'T match
 * the canonical slugs ("food-drinks","tech-repairs") — so the category filter
 * silently returned nothing on real data. */
export const CATEGORIES = categories.map((c) => ({ slug: c.slug, label: c.name }));

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
 * Genuine, student-relevant filters only. Warm, premium, readable.
 * Preserves every data-testid so e2e stays green; visual layer only.
 */
export function Filters({
  value,
  onChange,
  presetCategory,
  listings,
  campus,
  campusOptions = [],
  onCampusChange,
}: {
  value: ExploreFilters;
  onChange: (next: ExploreFilters) => void;
  presetCategory?: string;
  listings?: ExploreListing[];
  campus?: string;
  campusOptions?: { id: string; name: string }[];
  onCampusChange?: (campus: string) => void;
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

  const hasActive =
    value.category || value.minPrice || value.maxPrice || value.verifiedOnly;

  // P-A round 7 (per user: fewer filters, modern UX): only VERIFIED remains as
  // a quick filter. openNow/featuredOnly/hasPhotos/recentlyActive/minRating were
  // either mock-only (never populated by real data) or proven dead — removed
  // to stop the panel feeling like clutter.
  const quickFilters = [
    { key: "verifiedOnly" as const, testid: "filter-verified-pill", label: "Verified", icon: "✓" },
  ];

  return (
    <div data-testid="explore-filters" style={panelStyle}>
      <h3 style={panelTitleStyle}>Filters</h3>

      {/* University — P-A round 9 (v4.1): campus selector lives INSIDE the
          filter panel (was in the topbar). Only rendered when options exist. */}
      {campusOptions.length > 0 && (
        <Field label="University">
          <select
            data-testid="filter-university"
            value={campus ?? ""}
            onChange={(e) => onCampusChange?.(e.target.value)}
            style={modernSelectStyle}
          >
            <option value="">All universities</option>
            {campusOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
      )}

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
        <legend style={legendStyle}>Price range (₦)</legend>
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
              const bucket = priceStats.prices.filter(
                (p) => p >= bucketMin && p < bucketMax && p >= (value.minPrice ?? priceStats.min) && p <= (value.maxPrice ?? priceStats.max)
              );
              return bucket.length;
            })}
          />
        )}
        {(value.minPrice || value.maxPrice) && (
          <p style={priceSummaryStyle}>
            {value.minPrice && value.maxPrice
              ? `${formatNaira(value.minPrice)} – ${formatNaira(value.maxPrice)}`
              : value.minPrice
              ? `From ${formatNaira(value.minPrice)}`
              : value.maxPrice
              ? `Up to ${formatNaira(value.maxPrice)}`
              : ""}
          </p>
        )}
      </fieldset>

      <div style={{ height: 1, background: "var(--color-ink-subtle)", margin: 0 }} />

      {/* Quick filters — pill toggles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={quickFiltersLabelStyle}>Quick filters</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {quickFilters.map(({ key, testid, label, icon }) => {
            const active = !!value[key];
            return (
              <button
                key={key}
                data-testid={testid}
                aria-pressed={active}
                onClick={() => set({ [key]: active ? undefined : true } as Partial<ExploreFilters>)}
                className={`voeq-pill${active ? " is-active" : ""}`}
              >
                <span aria-hidden="true" style={{ opacity: active ? 1 : 0.7 }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear all button */}
      {hasActive && (
        <button
          onClick={() => onChange({})}
          style={clearAllStyle}
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={fieldStyle}>
      {label}
      {children}
    </label>
  );
}

// ---- styles ----
const panelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
  background: "#fffdf8",
  border: "1px solid rgba(30,59,47,.09)",
  borderRadius: 18,
  padding: "var(--space-3)",
  boxShadow: "0 6px 20px rgba(30,59,47,.06)",
};

const panelTitleStyle: React.CSSProperties = {
  fontFamily: "var(--role-font-display)",
  fontSize: 18,
  margin: 0,
  color: "var(--color-forest)",
  paddingBottom: "var(--space-2)",
  borderBottom: "1px solid rgba(30,59,47,.08)",
  letterSpacing: "-0.01em",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  fontSize: 13.5,
  fontWeight: 600,
  color: "var(--color-forest-mid)",
  fontFamily: "var(--role-font-ui)",
};

const legendStyle: React.CSSProperties = {
  fontSize: 13.5,
  fontWeight: 600,
  color: "var(--color-forest-mid)",
  fontFamily: "var(--role-font-ui)",
  marginBottom: 8,
};

const modernSelectStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(30,59,47,.12)",
  background: "#f6f1e6",
  color: "var(--color-forest)",
  fontFamily: "var(--role-font-ui)",
  fontSize: 14,
  cursor: "pointer",
};

const priceSummaryStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--color-forest-mid)",
  margin: 0,
  marginTop: 6,
};

const quickFiltersLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-ink-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: 0,
};

/** kobo (minor units) -> "₦6,500" with thousands separators (en-NG). */
function formatNaira(minor: number): string {
  return `₦${new Intl.NumberFormat("en-NG").format(Math.round(minor / 100))}`;
}

const clearAllStyle: React.CSSProperties = {
  padding: "10px",
  background: "transparent",
  color: "var(--color-forest-mid)",
  border: "1px solid rgba(30,59,47,.12)",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  marginTop: "var(--space-2)",
};
