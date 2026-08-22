"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useExploreData } from "@/lib/useExploreData";
import type { ExploreFilters, ExploreListing } from "@voeq/data";
import { ContourEdge } from "@voeq/contour";
import { ListingCard } from "./ListingCard";
import { Filters } from "./Filters";
import { SearchBar } from "./SearchBar";
import { TrendingRail } from "./TrendingRail";
import { RecentlyViewedRail, useRecentlyViewed } from "./RecentlyViewedRail";
import { ExploreSkeleton } from "./ExploreSkeleton";

/**
 * Explore — PG-PUB-002 (Doc 04). The core discovery surface.
 *
 * Continuity (Doc 05 D.4.1 REPLACEMENT MECHANISM note, 2026-08-18):
 *  1. Contour-carry (PRIMARY): the contour line animates in on mount, carrying the motif from Landing.
 *  2. Shared spatial anchor (PRIMARY): the top bar mirrors Landing's nav exactly (same --nav-height,
 *     --nav-inline-pad, wordmark 20px display font at the same 16px left offset) — a genuine shared
 *     anchor. (Landing files are out of scope, so the true cross-route shared-element morph is limited;
 *     this is the Explore-side entrance carrying the language, per approved workaround.)
 *  3. Deep transient accent (UNPROVEN, optional): a brief deep-green flash on the contour line mid-
 *     entrance. Attempted; if it reads as a glitch it is cut. See transition note in code below.
 */
const DEFAULT_CAMPUS = "NMU"; // public, logged-out default (Doc 04: works fully logged-out)

/**
 * Explore — the single discover surface. Filters/sort/search/campus all run through
 * loadExplore (data layer applies them). Campus is passed in (dynamic, VS4.9).
 */
export function Explore({ categoryPreset, campus = DEFAULT_CAMPUS }: { categoryPreset?: string; campus?: string }) {
  const [filters, setFilters] = useState<ExploreFilters>({});
  const [query, setQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [forceError, setForceError] = useState(false);
  const { ids: recentIds, record } = useRecentlyViewed();

  // Sync ?exploreError=1 (dev/test forced-failure path) + ?q= deep links.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setForceError(p.get("exploreError") === "1");
    const q = p.get("q");
    if (q) setQuery(q);
  }, []);

  const { status, data, trending, error, cached, retry } = useExploreData({
    campus,
    query,
    categoryPreset,
    forceError,
    ...filters,
  });

  const recentItems: ExploreListing[] = useMemo(
    () => cached?.filter((l) => recentIds.includes(l.id)) ?? [],
    [cached, recentIds]
  );

  const onCardClick = (id: string) => record(id);

  return (
    <div data-testid="explore" style={{ minHeight: "100vh" }}>
      {/* Shared spatial anchor — mirrors Landing nav geometry exactly (D.4.1 component 2) */}
      <header
        data-testid="explore-topbar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          height: "var(--nav-height)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingInline: "var(--nav-inline-pad)",
          background: "var(--nav-bg)",
          borderBottom: "1px solid var(--nav-border)",
        }}
      >
        <Link href="/" data-testid="explore-wordmark" style={wordmarkStyle}>
          Voeq
        </Link>
        <span data-testid="explore-campus-indicator" style={chipStyle}>
          {campus}
        </span>
      </header>

      <main style={{ padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)" }}>
        {/* Continuity entrance: contour carries in (component 1). Shared anchor bar above (component 2).
            Component 3 (Deep transient flash) was PROTOTYPED and CUT — it read as a glitch on a 1px
            hairline rather than continuity; per Doc 05 D.4.1 note it is optional/unproven and removed. */}
        <div data-testid="explore-contour-anchor" className="explore-entrance">
          <ContourEdge intensity="whisper" />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)", marginBlock: "var(--space-2)" }}>
          <h1 data-testid="explore-heading" style={headingStyle}>
            {categoryPreset ? `Explore · ${categoryPreset}` : "Explore"}
          </h1>
          <button
            data-testid="explore-filters-toggle"
            className="explore-mobile-only"
            onClick={() => setMobileFiltersOpen(true)}
            style={ghostBtn}
          >
            Filters
          </button>
        </div>

        {/* Campus indicator (required visible content) */}
        <div data-testid="explore-campus-banner" style={{ ...chipStyle, display: "inline-flex", marginBottom: "var(--space-2)" }}>
          Showing the marketplace near {campus}
        </div>

        <SearchBar initial={query} onSearch={setQuery} />

        {/* Desktop: persistent filter sidebar + grid. Mobile: bottom-sheet filters. */}
        <div className="explore-layout" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
          <aside data-testid="explore-sidebar" className="explore-desktop-only" style={{ display: "block" }}>
            <Filters value={filters} onChange={setFilters} presetCategory={categoryPreset} />
          </aside>

          <div>
            {status === "loading" && <ExploreSkeleton />}

            {status === "error" && (
              <div data-testid="explore-error" role="alert" style={stateBox}>
                <p>Couldn’t load listings{error ? ` (${error})` : ""}.</p>
                {cached && cached.length > 0 && (
                  <p data-testid="explore-partial" style={{ color: "var(--role-text-muted)" }}>
                    Showing last loaded results — some content couldn’t load.
                  </p>
                )}
                <button data-testid="explore-retry" onClick={retry} style={primaryBtn}>
                  Retry
                </button>
              </div>
            )}

            {status === "empty" && (
              <div data-testid="explore-empty" style={stateBox}>
                <h2 style={{ margin: 0 }}>No vendors yet on {campus}</h2>
                <p style={{ color: "var(--role-text-muted)" }}>
                  Be the first to share what you’re selling near {campus}.
                </p>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <Link href="/" data-testid="explore-empty-browse" style={primaryBtn}>Browse other campuses</Link>
                  <Link href="/for-vendors" data-testid="explore-empty-vendor" style={ghostBtn}>Become a vendor</Link>
                </div>
              </div>
            )}

            {status === "success" && (
              <>
                <TrendingRail items={trending} />
                {recentItems.length > 0 && <RecentlyViewedRail items={recentItems} />}
                <div data-testid="explore-grid" style={gridStyle}>
                  {data.map((l) => (
                    <Link
                      key={l.id}
                      href={`/listing/${l.id}`}
                      data-testid="explore-card-link"
                      onClick={() => onCardClick(l.id)}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <ListingCard listing={l} />
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Mobile bottom-sheet filters */}
      {mobileFiltersOpen && (
        <div data-testid="explore-filters-sheet" role="dialog" aria-modal="true" style={sheetStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
            <strong>Filters</strong>
            <button data-testid="explore-filters-close" onClick={() => setMobileFiltersOpen(false)} style={ghostBtn}>
              Done
            </button>
          </div>
          <Filters value={filters} onChange={setFilters} presetCategory={categoryPreset} />
        </div>
      )}
    </div>
  );
}

// ---- styles ----
const wordmarkStyle: React.CSSProperties = {
  fontFamily: "var(--role-font-display)",
  fontSize: "20px",
  fontWeight: 600,
  color: "var(--role-text)",
  textDecoration: "none",
  lineHeight: 1,
};
const chipStyle: React.CSSProperties = {
  fontFamily: "var(--role-font-ui)",
  fontSize: "13px",
  color: "var(--role-text-muted)",
  background: "var(--role-surface-sunken)",
  border: "1px solid var(--role-border)",
  borderRadius: 999,
  padding: "4px 10px",
};
const headingStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 600,
  color: "var(--role-text)",
  fontFamily: "var(--role-font-display)",
  margin: 0,
};
const ghostBtn: React.CSSProperties = {
  fontFamily: "var(--role-font-ui)",
  fontSize: "14px",
  padding: "8px 14px",
  borderRadius: "var(--radius)",
  border: "1px solid var(--role-border)",
  background: "transparent",
  color: "var(--role-text)",
  cursor: "pointer",
  textDecoration: "none",
};
const primaryBtn: React.CSSProperties = {
  ...ghostBtn,
  background: "var(--role-accent-strong)",
  color: "var(--role-on-accent)",
  borderColor: "var(--role-accent-strong)",
};
const stateBox: React.CSSProperties = {
  border: "1px solid var(--role-border)",
  borderRadius: "var(--radius-lg)",
  padding: "var(--space-4)",
  background: "var(--role-surface)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-2)",
  alignItems: "flex-start",
};
const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: "var(--space-2)",
};
const sheetStyle: React.CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 50,
  background: "var(--role-surface)",
  borderTop: "1px solid var(--role-border)",
  borderTopLeftRadius: "var(--radius-lg)",
  borderTopRightRadius: "var(--radius-lg)",
  padding: "var(--space-3)",
  boxShadow: "var(--shadow-2)",
};
