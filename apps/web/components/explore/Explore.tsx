"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useExploreData } from "@/lib/useExploreData";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { useInfiniteScroll } from "@/lib/useInfiniteScroll";
import { useBookmarks } from "@/lib/useBookmarks";
import type { ExploreFilters, ExploreListing } from "@voeq/data";
import { ContourEdge } from "@voeq/contour";
import { BrandLogo } from "../landing/BrandLogo";
import { CampusSelector } from "./CampusSelector";
import { ListingCard } from "./ListingCard";
import { ListingRow } from "./ListingRow";
import { Filters, CATEGORIES } from "./Filters";
import { SearchBar } from "./SearchBar";
import { TrendingRail } from "./TrendingRail";
import { OnboardingBanner } from "./OnboardingBanner";
import { RecentlyViewedRail, useRecentlyViewed } from "./RecentlyViewedRail";
import { ExploreSkeleton } from "./ExploreSkeleton";
import { EmptyState } from "./EmptyState";
import { RefreshCw, ChevronDown, LayoutGrid, List } from "lucide-react";

/**
 * Explore — PG-PUB-002 (Doc 04). The core discovery surface.
 * K2.9: Enhanced with pull-to-refresh, infinite scroll, and swipe gestures.
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
const DEFAULT_CAMPUS = "nmu-okerenkoko"; // public, logged-out default (Doc 04: works fully logged-out)
const ITEMS_PER_PAGE = 20; // Pagination size for infinite scroll

// PassA-9: friendly results lead-in — sort value → human label
const SORT_LABEL: Record<string, string> = {
  relevance: "Most popular",
  distance: "Distance (nearest)",
  newest: "Newest first",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "rating-desc": "Top rated",
};

/**
 * Explore — the single discover surface. Filters/sort/search/campus all run through
 * loadExplore (data layer applies them). Campus is passed in (dynamic, VS4.9).
 * initialQuery: pre-fill search from URL param (hero search support)
 * Campus can be switched via CampusSelector (persists to localStorage)
 */
export function Explore({ 
  categoryPreset, 
  campus: initialCampus = DEFAULT_CAMPUS,
  initialQuery,
  viewerIdentityId,
}: { 
  categoryPreset?: string; 
  campus?: string;
  initialQuery?: string;
  viewerIdentityId?: string;
}) {
  const [filters, setFilters] = useState<ExploreFilters>({});
  const [query, setQuery] = useState(initialQuery || "");
  const [campus, setCampus] = useState(initialCampus);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [forceError, setForceError] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  const { ids: recentIds, record } = useRecentlyViewed();
  const { toggle: toggleBookmark, isBookmarked } = useBookmarks();

  // Load preferred campus from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("voeq:preferred-campus");
    if (stored) {
      setCampus(stored);
    }
  }, []);

  // Hydrate view/density from localStorage; default compact on mobile.
  useEffect(() => {
    const v = localStorage.getItem("voeq:explore-view");
    const d = localStorage.getItem("voeq:explore-density");
    if (v === "grid" || v === "list") setView(v);
    if (d === "comfortable" || d === "compact") setDensity(d);
    else if (typeof window !== "undefined" && window.innerWidth < 768) setDensity("compact");
  }, []);

  // Persist view/density across sessions.
  useEffect(() => {
    localStorage.setItem("voeq:explore-view", view);
  }, [view]);
  useEffect(() => {
    localStorage.setItem("voeq:explore-density", density);
  }, [density]);

  // Sync ?exploreError=1 (dev/test forced-failure path)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setForceError(p.get("exploreError") === "1");
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

  // Reset pagination when filters change (K2.9 #2)
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [filters, query, campus, categoryPreset]);

  // Paginated data for infinite scroll (K2.9 #2)
  const displayedData = useMemo(() => 
    data.slice(0, displayedCount),
    [data, displayedCount]
  );

  const hasMore = displayedCount < data.length;

  // Pull-to-refresh handler (K2.9 #1)
  const handleRefresh = useCallback(async () => {
    await retry();
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [retry]);

  const { pulling, refreshing, pullDistance } = usePullToRefresh({
    onRefresh: handleRefresh,
    disabled: status === "loading",
  });

  // Infinite scroll handler (K2.9 #2)
  const handleLoadMore = useCallback(async () => {
    // Simulate network delay for smooth UX
    await new Promise(resolve => setTimeout(resolve, 300));
    setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, data.length));
  }, [data.length]);

  const { loading: loadingMore, manualLoadMore } = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore,
    threshold: 0.8,
    disabled: status !== "success",
  });

  // Count active filters (excluding sort which is always set)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.minRating) count++;
    if (filters.openNow) count++;
    if (filters.hasPhotos) count++;
    if (filters.recentlyActive) count++;
    if (filters.featuredOnly) count++;
    return count;
  }, [filters]);

  const clearAllFilters = () => {
    setFilters({ sort: filters.sort }); // Keep sort, clear everything else
  };

  // PassA-7: remove a single filter (used by the filtered-empty "Try removing a filter" CTA).
  // Clears the first present filter field so the user gets somewhere to go.
  const removeOneFilter = () => {
    const next: ExploreFilters = { ...filters };
    const order: (keyof ExploreFilters)[] = [
      "category", "minPrice", "maxPrice", "minRating",
      "openNow", "hasPhotos", "recentlyActive", "featuredOnly",
    ];
    for (const key of order) {
      if (key !== "sort" && next[key] !== undefined) {
        delete next[key];
        break;
      }
    }
    setFilters(next);
  };

  const removeFilter = (key: keyof ExploreFilters) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div data-testid="explore" style={{ minHeight: "100vh", position: "relative" }}>
      {/* Pull-to-refresh indicator (K2.9 #1) */}
      {(pulling || refreshing) && (
        <div 
          data-testid="pull-to-refresh-indicator"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: Math.min(pullDistance, 80),
            background: "var(--role-surface)",
            borderBottom: "1px solid var(--role-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            transition: refreshing ? "none" : "height 200ms ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-forest)" }}>
            <RefreshCw 
              size={20} 
              style={{ 
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }} 
            />
            <span style={{ fontSize: "14px", fontFamily: "var(--role-font-ui)", fontWeight: 500 }}>
              {refreshing ? "Refreshing..." : pullDistance >= 80 ? "Release to refresh" : "Pull to refresh"}
            </span>
          </div>
        </div>
      )}
      
      {/* Shared spatial anchor — mirrors Landing nav geometry exactly (D.4.1 component 2) */}
      <header
        data-testid="explore-topbar"
        className="voeq-topbar"
      >
        <Link href="/" data-testid="explore-wordmark" aria-label="Voeq" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <BrandLogo width={64} />
        </Link>

        {/* Search bar — the alive, centered anchor of the header */}
        <div className="voeq-topbar-search">
          <SearchBar initial={query} onSearch={setQuery} listings={data} />
        </div>

        {/* Campus selector - right side, rich pill */}
        <div className="voeq-topbar-campus">
          <CampusSelector currentCampus={campus} onChange={setCampus} viewerIdentityId={viewerIdentityId} />
        </div>
      </header>

      <main style={{ padding: "var(--space-3) 0 var(--space-8)" }}>
        {/* Continuity entrance: contour carries in (component 1). Shared anchor bar above (component 2).
            Component 3 (Deep transient flash) was PROTOTYPED and CUT — it read as a glitch on a 1px
            hairline rather than continuity; per Doc 05 D.4.1 note it is optional/unproven and removed. */}
        <div data-testid="explore-contour-anchor" className="explore-entrance" style={{ paddingInline: "var(--nav-inline-pad)" }}>
          <ContourEdge intensity="whisper" />
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "var(--space-4)", paddingInline: "var(--nav-inline-pad)" }}>
          <div>
            <h1 data-testid="explore-heading" style={{...headingStyle, marginBottom: 8}}>
              {categoryPreset ? `Explore · ${categoryPreset}` : "Explore"}
            </h1>
            <p style={{ fontSize: 15, color: "var(--role-muted)", margin: 0 }}>
              Discover vendors, services, and products on campus
            </p>
          </div>
          {/* Mobile filters button — right-aligned with heading on mobile */}
          <button
            data-testid="explore-filters-toggle"
            className="explore-mobile-only"
            onClick={() => setMobileFiltersOpen(true)}
            style={{...ghostBtn, position: 'relative', flexShrink: 0}}
          >
            Filters
            {activeFilterCount > 0 && (
              <span style={filterBadgeStyle}>{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Category quick-pills - horizontal scroll */}
        {!categoryPreset && (
          <div style={{ marginBlock: "var(--space-3)", overflowX: "auto", whiteSpace: "nowrap", paddingInline: "var(--nav-inline-pad)" }}>
            <div style={{ display: "inline-flex", gap: "var(--space-2)" }}>
              <button
                onClick={() => removeFilter('category')}
                style={{
                  ...categoryPillStyle,
                  ...(filters.category ? {} : categoryPillActiveStyle),
                }}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setFilters((prev) => ({ ...prev, category: cat.slug }))}
                  style={{
                    ...categoryPillStyle,
                    ...(filters.category === cat.slug ? categoryPillActiveStyle : {}),
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active filter chips bar */}
        {activeFilterCount > 0 && (
          <div style={{ marginBlock: "var(--space-2)", display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center", paddingInline: "var(--nav-inline-pad)" }}>
            <span style={{ fontSize: "13px", color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}>
              Active filters:
            </span>
            {filters.category && (
              <FilterChip label={`Category: ${CATEGORIES.find(c => c.slug === filters.category)?.label}`} onRemove={() => removeFilter('category')} />
            )}
            {filters.minPrice && (
              <FilterChip label={`Min: ₦${filters.minPrice / 100}`} onRemove={() => removeFilter('minPrice')} />
            )}
            {filters.maxPrice && (
              <FilterChip label={`Max: ₦${filters.maxPrice / 100}`} onRemove={() => removeFilter('maxPrice')} />
            )}
            {filters.minRating && (
              <FilterChip label={`${filters.minRating}+ stars`} onRemove={() => removeFilter('minRating')} />
            )}
            {filters.openNow && (
              <FilterChip label="Open now" onRemove={() => removeFilter('openNow')} />
            )}
            {filters.hasPhotos && (
              <FilterChip label="Has photos" onRemove={() => removeFilter('hasPhotos')} />
            )}
            {filters.recentlyActive && (
              <FilterChip label="Recently active" onRemove={() => removeFilter('recentlyActive')} />
            )}
            {filters.featuredOnly && (
              <FilterChip label="Featured" onRemove={() => removeFilter('featuredOnly')} />
            )}
            <button
              onClick={clearAllFilters}
              style={{
                ...ghostBtn,
                padding: "4px 10px",
                fontSize: "12px",
                color: "var(--role-accent-strong)",
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Desktop: persistent filter sidebar + grid. Mobile: bottom-sheet filters. */}
        <div className="explore-layout" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "var(--space-3)", marginTop: "var(--space-3)", paddingInline: "var(--nav-inline-pad)" }}>
          <aside
            data-testid="explore-sidebar"
            className="explore-desktop-only"
            style={{
              display: "block",
              position: "sticky",
              top: "calc(var(--nav-height) + var(--space-3))",
              alignSelf: "start",
              maxHeight: "calc(100vh - var(--nav-height) - var(--space-4))",
              overflowY: "auto",
            }}
          >
            <Filters value={filters} onChange={setFilters} presetCategory={categoryPreset} listings={data} />
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
                {/* Onboarding nudge — new users with no recently-viewed listings */}
                {recentIds.length === 0 && (
                  <OnboardingBanner currentCampus={campus} onCampusChange={setCampus} />
                )}
                {/* Results header: count (left) + sort (right) */}
                {data.length === 0 ? (
                  <EmptyState
                    currentCategory={categoryPreset || filters.category}
                    searchQuery={query}
                    hasActiveFilters={activeFilterCount > 0}
                    onClearAll={clearAllFilters}
                    onRemoveOneFilter={removeOneFilter}
                    closestMatches={trending}
                  />
                ) : (
                  <div className="voeq-toolbar" data-testid="explore-results-toolbar">
                    <div
                      data-testid="explore-results-count"
                      className="voeq-toolbar-count"
                    >
                      {data.length === 1 ? (
                        "1 result on your campus"
                      ) : activeFilterCount === 0 ? (
                        `${data.length} results on your campus · sorted by ${SORT_LABEL[filters.sort ?? "relevance"]}`
                      ) : (
                        `${data.length} results on your campus with ${activeFilterCount} ${activeFilterCount === 1 ? "filter" : "filters"} · sorted by ${SORT_LABEL[filters.sort ?? "relevance"]}`
                      )}
                    </div>

                    <div className="voeq-toolbar-controls">
                      <div className="voeq-select-wrap">
                        <span className="voeq-select-label">Sort</span>
                        <select
                          data-testid="explore-sort"
                          value={filters.sort ?? "relevance"}
                          onChange={(e) =>
                            setFilters((prev) => ({ ...prev, sort: e.target.value as ExploreFilters["sort"] }))
                          }
                          className="voeq-select"
                        >
                          <option value="relevance">Most popular</option>
                          <option value="distance">Distance (nearest)</option>
                          <option value="newest">Newest first</option>
                          <option value="price-asc">Price: Low to High</option>
                          <option value="price-desc">Price: High to Low</option>
                          <option value="rating-desc">Top rated</option>
                        </select>
                        <span className="voeq-select-caret"><ChevronDown size={16} /></span>
                      </div>

                      {/* View + density toggles */}
                      <div className="voeq-segmented" role="group" aria-label="View mode">
                        <button
                          data-testid="explore-view-grid"
                          aria-pressed={view === "grid"}
                          aria-label="Grid view"
                          className={view === "grid" ? "is-active" : ""}
                          onClick={() => setView("grid")}
                        >
                          <LayoutGrid size={16} />
                        </button>
                        <button
                          data-testid="explore-view-list"
                          aria-pressed={view === "list"}
                          aria-label="List view"
                          className={view === "list" ? "is-active" : ""}
                          onClick={() => setView("list")}
                        >
                          <List size={16} />
                        </button>
                      </div>

                      <div className="voeq-segmented" role="group" aria-label="Density">
                        <button
                          data-testid="explore-density-comfortable"
                          aria-pressed={density === "comfortable"}
                          aria-label="Comfortable density"
                          className={density === "comfortable" ? "is-active" : ""}
                          onClick={() => setDensity("comfortable")}
                        >
                          Comfortable
                        </button>
                        <button
                          data-testid="explore-density-compact"
                          aria-pressed={density === "compact"}
                          aria-label="Compact density"
                          className={density === "compact" ? "is-active" : ""}
                          onClick={() => setDensity("compact")}
                        >
                          Compact
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Featured listings carousel - larger cards, auto-rolling every 5s */}
                {data.some(l => l.featured) && (
                  <FeaturedCarousel items={data.filter(l => l.featured)} />
                )}
                
                <TrendingRail items={trending} />
                {status === "success" && <RecentlyViewedRail items={recentItems} ids={recentIds} />}
                {view === "list" ? (
                  <div
                    data-testid="explore-list"
                    style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-3)" }}
                  >
                    {displayedData.map((l) => (
                      <ListingRow key={l.id} listing={l} onNavigate={onCardClick} />
                    ))}
                  </div>
                ) : (
                <div data-testid="explore-grid" className="voeq-grid">
                  {displayedData.map((l) => (
                    <Link
                      key={l.id}
                      href={`/listing/${l.id}`}
                      data-testid="explore-card-link"
                      onClick={() => onCardClick(l.id)}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <ListingCard 
                        listing={l} 
                        isBookmarked={isBookmarked(l.id)}
                        onToggleBookmark={toggleBookmark}
                      />
                    </Link>
                  ))}
                </div>
                )}
                
                {/* Infinite scroll: Load more button (K2.9 #2) */}
                {hasMore && (
                  <div style={{ 
                    marginTop: "var(--space-4)", 
                    display: "flex", 
                    justifyContent: "center" 
                  }}>
                    <button
                      data-testid="explore-load-more"
                      onClick={manualLoadMore}
                      disabled={loadingMore}
                      style={{
                        ...primaryBtn,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 200,
                        justifyContent: "center",
                      }}
                    >
                      {loadingMore ? (
                        <>
                          <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} />
                          Load more ({data.length - displayedCount} remaining)
                        </>
                      )}
                    </button>
                  </div>
                )}
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
          <Filters value={filters} onChange={setFilters} presetCategory={categoryPreset} listings={data} />
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
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 8px",
  background: "var(--color-glass-white)",
  borderRadius: "8px",
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

const categoryPillStyle: React.CSSProperties = {
  fontFamily: "var(--role-font-ui)",
  fontSize: "14px",
  padding: "6px 14px",
  borderRadius: 999,
  border: "1px solid var(--role-border)",
  background: "var(--role-surface)",
  color: "var(--role-text)",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "all 120ms ease",
};

const categoryPillActiveStyle: React.CSSProperties = {
  background: "var(--color-forest)",
  color: "var(--color-glass-white)",
  borderColor: "var(--color-forest)",
};

const filterBadgeStyle: React.CSSProperties = {
  position: "absolute",
  top: -4,
  right: -4,
  background: "var(--color-amber)",
  color: "var(--color-ink)",
  fontSize: "10px",
  fontWeight: 600,
  borderRadius: 999,
  padding: "2px 6px",
  minWidth: 18,
  textAlign: "center",
};

// Filter chip component
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      background: "var(--role-surface)",
      border: "1px solid var(--role-border)",
      borderRadius: 999,
      fontSize: "13px",
      fontFamily: "var(--role-font-ui)",
      color: "var(--role-text)",
    }}>
      <span>{label}</span>
      <button
        onClick={onRemove}
        style={{
          border: "none",
          background: "transparent",
          color: "var(--role-text-muted)",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          fontSize: "16px",
          lineHeight: 1,
        }}
        aria-label={`Remove ${label} filter`}
      >
        ×
      </button>
    </div>
  );
}

// Featured carousel component - auto-advances every 5 seconds (K2.9 #3: Added swipe gestures)
function FeaturedCarousel({ items }: { items: ExploreListing[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Auto-advance timer
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000); // Auto-advance every 5 seconds
    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  // Swipe gesture handlers (K2.9 #3)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }

    // Reset
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div style={{ marginBottom: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--role-text)", fontFamily: "var(--role-font-display)", margin: 0 }}>
          Featured
        </h2>
        {items.length > 1 && (
          <div style={{ display: "flex", gap: 6 }}>
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  border: "none",
                  background: idx === currentIndex ? "var(--color-amber)" : "var(--role-border)",
                  cursor: "pointer",
                  padding: 0,
                  transition: "background 200ms ease",
                }}
                aria-label={`Go to featured listing ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      
      <Link
        href={`/listing/${currentItem.id}`}
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{
          position: "relative",
          background: "var(--role-surface)",
          border: "2px solid var(--color-amber)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          transition: "transform 200ms ease, box-shadow 200ms ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "var(--shadow-lg)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
        >
          {/* Featured badge */}
          <div style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "var(--color-amber)",
            color: "var(--color-ink)",
            fontSize: "12px",
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 999,
            fontFamily: "var(--role-font-ui)",
            zIndex: 1,
          }}>
            FEATURED
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, minHeight: 280 }} className="featured-carousel-grid">
            {/* Image side */}
            <div 
              className="featured-carousel-image"
              style={{ 
                backgroundImage: currentItem.image ? `url(${currentItem.image})` : "none",
                backgroundColor: currentItem.image ? "transparent" : "var(--role-surface-sunken)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: 280,
              }} 
            />
            
            {/* Content side */}
            <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ 
                  fontSize: "24px", 
                  fontWeight: 600, 
                  margin: "0 0 var(--space-2)", 
                  fontFamily: "var(--role-font-display)",
                  color: "var(--role-text)",
                }}>
                  {currentItem.title}
                </h3>
                {currentItem.vendorName && (
                  <p style={{ 
                    fontSize: "14px", 
                    color: "var(--role-text-muted)", 
                    margin: "0 0 var(--space-2)",
                    fontFamily: "var(--role-font-ui)",
                  }}>
                    by {currentItem.vendorName}
                  </p>
                )}
                {currentItem.categorySlug && (
                  <span style={{
                    display: "inline-block",
                    fontSize: "12px",
                    padding: "4px 10px",
                    background: "var(--role-surface-sunken)",
                    borderRadius: 999,
                    color: "var(--role-text-muted)",
                    fontFamily: "var(--role-font-ui)",
                  }}>
                    {CATEGORIES.find(c => c.slug === currentItem.categorySlug)?.label ?? currentItem.categorySlug}
                  </span>
                )}
              </div>
              
              <div>
                {typeof currentItem.vendorRatingAvg === "number" && (currentItem.vendorRatingCount ?? 0) > 0 ? (
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 4, 
                    marginBottom: "var(--space-2)",
                    fontSize: "14px",
                    color: "var(--role-text)",
                  }}>
                    <span>⭐</span>
                    <span style={{ fontWeight: 600 }}>{currentItem.vendorRatingAvg.toFixed(1)}</span>
                    <span style={{ color: "var(--role-text-muted)", fontSize: 12 }}>({currentItem.vendorRatingCount})</span>
                  </div>
                ) : (
                  <div style={{
                    fontSize: "12px",
                    color: "var(--role-text-muted)",
                    marginBottom: "var(--space-2)",
                  }}>
                    New
                  </div>
                )}
                <p style={{ 
                  fontSize: "20px", 
                  fontWeight: 600, 
                  color: "var(--color-forest)", 
                  margin: 0,
                  fontFamily: "var(--role-font-ui)",
                }}>
                  ₦{(currentItem.priceMinor / 100).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
