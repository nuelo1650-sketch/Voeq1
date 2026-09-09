"use client";

/**
 * MbFilterDrawer (Money Bag A12) — bottom sheet <768px / LEFT SIDEBAR ≥768px.
 *
 * Location (campus picker), Category (multi), Price (manual ₦ min/max —
 * NO sliders ever, founder-locked twice), Trust (Verified), Sort.
 * Apply shows a live count of matching listings; Clear all resets.
 *
 * Reuses the EXISTING Explore filter primitives (filter-university /
 * filter-sort / filter-price-min / filter-price-max testids preserved) so
 * probes and persistence (voeq:explore-filters) keep working (B5).
 */

import { useEffect, useMemo, useState } from "react";
import type { ExploreFilters } from "@voeq/data";
import { X } from "lucide-react";

export interface MbCampusOption {
  id: string;
  name: string;
}

export function MbFilterDrawer({
  open,
  onClose,
  filters,
  onChange,
  campus,
  onCampusChange,
  campusOptions,
  categoryOptions,
  sort,
  onSortChange,
  matchCount,
  isMobile,
}: {
  open: boolean;
  onClose: () => void;
  filters: ExploreFilters;
  onChange: (f: ExploreFilters) => void;
  campus?: string;
  onCampusChange: (c: string) => void;
  campusOptions: MbCampusOption[];
  categoryOptions: { slug: string; label: string }[];
  sort: string;
  onSortChange: (s: string) => void;
  matchCount: number;
  isMobile: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !open) return null;

  const cats: string[] = filters.category ? [filters.category] : [];
  const toggleCat = (slug: string) => {
    // Category is single-select in the data layer today (ExploreFilters.category)
    // — multi-select UI arrives with the taxonomy API; keep honest, no fake multi.
    onChange({ ...filters, category: cats.includes(slug) ? undefined : slug });
  };

  const activeCount =
    (filters.category ? 1 : 0) +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0);

  const label = "13px";
  const sectionHead: React.CSSProperties = {
    margin: "0 0 8px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--role-muted)",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid var(--role-border)",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 16, // iOS zoom floor
    background: "var(--role-surface)",
    color: "var(--role-text)",
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none" as const };

  const body = (
    <>
      <div>
        <h4 style={sectionHead}>Location</h4>
        <select
          data-testid="filter-university"
          value={campus ?? ""}
          onChange={(e) => onCampusChange(e.target.value)}
          style={selectStyle}
        >
          <option value="">All campuses</option>
          {campusOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h4 style={sectionHead}>Category</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {categoryOptions.map((c) => {
            const on = cats.includes(c.slug);
            return (
              <button
                key={c.slug}
                data-testid={`mb-cat-${c.slug}`}
                onClick={() => toggleCat(c.slug)}
                aria-pressed={on}
                style={{
                  border: `1px solid ${on ? "var(--forest-deep, #0F2A1D)" : "var(--role-border)"}`,
                  background: on ? "var(--forest-deep, #0F2A1D)" : "var(--role-surface)",
                  color: on ? "#f6f1e6" : "var(--role-text)",
                  borderRadius: 999,
                  padding: "7px 14px",
                  fontSize: label,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 style={sectionHead}>Price (₦)</h4>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            data-testid="filter-price-min"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              onChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            style={inputStyle}
          />
          <span style={{ color: "var(--role-muted)" }}>–</span>
          <input
            data-testid="filter-price-max"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              onChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            style={inputStyle}
          />
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--role-muted)" }}>
          Prices are agreed in chat — these just narrow the floor.
        </p>
      </div>

      <div>
        <h4 style={sectionHead}>Trust</h4>
        <label
          style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}
        >
          <input
            data-testid="filter-verified"
            type="checkbox"
            checked={Boolean(filters.verifiedOnly)}
            onChange={(e) => onChange({ ...filters, verifiedOnly: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: "var(--forest-deep, #0F2A1D)" }}
          />
          Verified vendors only
        </label>
      </div>

      <div>
        <h4 style={sectionHead}>Sort</h4>
        <select
          data-testid="filter-sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          style={selectStyle}
        >
          <option value="relevance">Relevance</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating-desc">Top rated</option>
        </select>
      </div>
    </>
  );

  const sheet: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        background: "var(--role-surface, #fffef9)",
        borderRadius: "20px 20px 0 0",
        padding: "14px 18px calc(18px + env(safe-area-inset-bottom))",
        maxHeight: "82vh",
        overflowY: "auto",
        boxShadow: "0 -12px 40px rgba(15,42,29,0.18)",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }
    : {
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: 320,
        zIndex: 60,
        background: "var(--role-surface, #fffef9)",
        boxShadow: "12px 0 40px rgba(15,42,29,0.12)",
        padding: "18px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      };

  return (
    <>
      <div
        data-testid="mb-drawer-veil"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,42,29,0.35)",
          zIndex: 50,
        }}
      />
      <aside data-testid="mb-filter-drawer" role="dialog" aria-modal="true" aria-label="Filters" style={sheet}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--role-font-display)",
              fontSize: 20,
              color: "var(--forest-deep, #0F2A1D)",
            }}
          >
            Filters
          </h3>
          <button
            data-testid="mb-filters-close"
            onClick={onClose}
            aria-label="Close filters"
            style={{
              border: "1px solid var(--role-border)",
              background: "var(--role-surface)",
              borderRadius: 999,
              width: 36,
              height: 36,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--role-text)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {body}

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 4,
            position: "sticky",
            bottom: 0,
            paddingTop: 10,
            background: "var(--role-surface, #fffef9)",
          }}
        >
          <button
            data-testid="mb-filters-clear"
            onClick={() => {
              onChange({});
              onSortChange("relevance");
            }}
            style={{
              flex: 1,
              border: "1px solid var(--role-border)",
              background: "var(--role-surface)",
              color: "var(--role-text)",
              borderRadius: 12,
              padding: "12px 0",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear all
          </button>
          <button
            data-testid="mb-filters-apply"
            onClick={onClose}
            style={{
              flex: 2,
              border: "none",
              background: "var(--forest-deep, #0F2A1D)",
              color: "#f6f1e6",
              borderRadius: 12,
              padding: "12px 0",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Show {matchCount} {matchCount === 1 ? "listing" : "listings"}
          </button>
        </div>
        {activeCount > 0 && (
          <p style={{ margin: 0, fontSize: 12, color: "var(--role-muted)", textAlign: "center" }}>
            {activeCount} filter{activeCount === 1 ? "" : "s"} active
          </p>
        )}
      </aside>
    </>
  );
}
