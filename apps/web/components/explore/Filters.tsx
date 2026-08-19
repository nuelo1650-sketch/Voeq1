"use client";

import type { ExploreFilters } from "@voeq/data";

export const CATEGORIES = [
  { slug: "food", label: "Food" },
  { slug: "books", label: "Books" },
  { slug: "beauty", label: "Beauty" },
  { slug: "apparel", label: "Apparel" },
  { slug: "services", label: "Services" },
];

const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
  { value: "rating-desc", label: "Top rated" },
] as const;

/**
 * Filters — the filter control surface (Doc 04 PG-PUB-002). Rendered as a persistent sidebar
 * on desktop and inside a bottom sheet on mobile (handled by Explore). All changes flow up via
 * onChange with a meaningful transition (D.2/D.4) — no instant snap. `disabled` while a filter
 * is unavailable (e.g. during load).
 */
export function Filters({
  value,
  onChange,
  presetCategory,
}: {
  value: ExploreFilters;
  onChange: (next: ExploreFilters) => void;
  presetCategory?: string;
}) {
  const set = (patch: Partial<ExploreFilters>) => onChange({ ...value, ...patch });

  return (
    <div data-testid="explore-filters" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <Field label="Category">
        <select
          data-testid="filter-category"
          value={presetCategory ?? value.category ?? ""}
          disabled={!!presetCategory}
          onChange={(e) => set({ category: e.target.value || undefined })}
          style={inputStyle}
        >
          <option value="">All</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
        </select>
      </Field>

      <Field label="Price min (R)">
        <input
          data-testid="filter-min-price"
          type="number"
          min={0}
          value={value.minPrice ?? ""}
          onChange={(e) => set({ minPrice: e.target.value ? Number(e.target.value) * 100 : undefined })}
          style={inputStyle}
        />
      </Field>

      <Field label="Price max (R)">
        <input
          data-testid="filter-max-price"
          type="number"
          min={0}
          value={value.maxPrice ?? ""}
          onChange={(e) => set({ maxPrice: e.target.value ? Number(e.target.value) * 100 : undefined })}
          style={inputStyle}
        />
      </Field>

      <Field label="Min rating">
        <input
          data-testid="filter-min-rating"
          type="number"
          min={0}
          max={5}
          step={0.5}
          value={value.minRating ?? ""}
          onChange={(e) => set({ minRating: e.target.value ? Number(e.target.value) : undefined })}
          style={inputStyle}
        />
      </Field>

      <label style={checkStyle}>
        <input
          data-testid="filter-verified"
          type="checkbox"
          checked={!!value.verifiedOnly}
          onChange={(e) => set({ verifiedOnly: e.target.checked })}
        />
        Verified only
      </label>

      <label style={checkStyle}>
        <input
          data-testid="filter-featured"
          type="checkbox"
          checked={!!value.featuredOnly}
          onChange={(e) => set({ featuredOnly: e.target.checked })}
        />
        Featured only
      </label>

      <Field label="Sort">
        <select
          data-testid="filter-sort"
          value={value.sort ?? "relevance"}
          onChange={(e) => set({ sort: e.target.value as ExploreFilters["sort"] })}
          style={inputStyle}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "13px", color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}>
      {label}
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: "var(--radius)",
  border: "1px solid var(--role-border)",
  background: "var(--role-surface)",
  color: "var(--role-text)",
  fontFamily: "var(--role-font-ui)",
  fontSize: "14px",
};

const checkStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  fontSize: "14px",
  color: "var(--role-text)",
  fontFamily: "var(--role-font-ui)",
};
