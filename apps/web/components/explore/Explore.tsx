"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useExploreData } from "@/lib/useExploreData";
import { useInfiniteScroll } from "@/lib/useInfiniteScroll";
import { useBookmarks } from "@/lib/useBookmarks";
import type { ExploreFilters, ExploreListing } from "@voeq/data";
import { ContourEdge } from "@voeq/contour";
import { BrandLogo } from "../landing/BrandLogo";
import { ListingCard } from "./ListingCard";
import { Filters, CATEGORIES } from "./Filters";
import { SearchBar } from "./SearchBar";
import { OnboardingBanner } from "./OnboardingBanner";
import { RecentlyViewedRail, useRecentlyViewed } from "./RecentlyViewedRail";
import { ExploreSkeleton } from "./ExploreSkeleton";
import { EmptyState } from "./EmptyState";
import { RefreshCw, ChevronDown } from "lucide-react";

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
  // P-A round 9 (v4.1): campus options for the University dropdown in Filters.
  const [campusOptions, setCampusOptions] = useState<{ id: string; name: string }[]>([]);
  // P-A round 9 (v4.1): list view + density toggles REMOVED. They were the source of
  // "half cards"/"just listing": a persisted list view hijacked the grid, and
  // density was a dead control (persisted but never applied). One clean,
  // industrial card grid — mobile 2-up compact, desktop 3/4-up.

  const { ids: recentIds, record } = useRecentlyViewed();
  const { toggle: toggleBookmark, isBookmarked } = useBookmarks();

  // P-A round 9 (S0): pull-to-refresh REMOVED (was causing gesture problems).
  // Refresh happens via normal re-entry; simpler and more reliable. Pull-to-
  // refresh hook + indicator gone.

  // Load preferred campus from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("voeq:preferred-campus");
    if (stored) {
      setCampus(stored);
    }
  }, []);

  // P-A round 9 (v4.1): fetch campus list (server /api/campuses/list) for the
  // University dropdown inside Filters — no client mock data.
  useEffect(() => {
    fetch("/api/campuses/list")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { campuses?: { id: string; name: string }[] } | null) => {
        if (d?.campuses?.length) setCampusOptions(d.campuses);
      })
      .catch(() => {});
  }, []);

  // P-A round 7: view/density persistence effects removed — no more list-view
  // or density state to hydrate. Mobile always renders the compact 2-up grid.

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
      {/* P-A round 9 (S0): pull-to-refresh indicator removed — gesture caused
          more problems than it solved. Content refresh via normal navigation. */}
      
      {/* P-A round 9 (v4.1, your call): topbar = logo (left) + FREE search.
          University moved into the Filters sheet (no dropdown up top). */}
      <header
        data-testid="explore-topbar"
        className="voeq-topbar"
      >
        <Link href="/" data-testid="explore-wordmark" aria-label="Voeq" className="voeq-topbar-wordmark" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0, order: 0 }}>
          <BrandLogo width={94} />
        </Link>

        <div className="voeq-topbar-search" style={{ order: 1 }}>
          <SearchBar initial={query} onSearch={setQuery} listings={data} />
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
              {categoryPreset ? `Explore · ${categoryPreset}` : "Find it. Chat it. Get it."}
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
                className={`voeq-pill${filters.category ? "" : " is-active"}`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setFilters((prev) => ({ ...prev, category: cat.slug }))}
                  className={`voeq-pill${filters.category === cat.slug ? " is-active" : ""}`}
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
              <FilterChip label={`Min: ${formatNaira(filters.minPrice)}`} onRemove={() => removeFilter('minPrice')} />
            )}
            {filters.maxPrice && (
              <FilterChip label={`Max: ${formatNaira(filters.maxPrice)}`} onRemove={() => removeFilter('maxPrice')} />
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
            {false && (
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

        {/* P-A: layout is a single column on mobile (cards full width);
            desktop (>=1024px) gets the 220px filter sidebar via CSS — no inline grid. */}
        <div className="explore-layout">
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
            <Filters value={filters} onChange={setFilters} presetCategory={categoryPreset} listings={data} campus={campus} campusOptions={campusOptions} onCampusChange={setCampus} />
          </aside>

          <div>
            {status === "loading" && <ExploreSkeleton />}

            {status === "error" && (
              <div data-testid="explore-error" role="alert" className="voeq-state">
                <p>Couldn’t load listings{error ? ` (${error})` : ""}.</p>
                {cached && cached.length > 0 && (
                  <p data-testid="explore-partial" style={{ color: "var(--role-text-muted)" }}>
                    Showing last loaded results — some content couldn’t load.
                  </p>
                )}
                <button data-testid="explore-retry" onClick={retry} className="voeq-btn voeq-btn--primary">
                  Retry
                </button>
              </div>
            )}

            {status === "empty" && (
              <div data-testid="explore-empty" className="voeq-state">
                <h2 style={{ margin: 0 }}>Your campus is waking up</h2>
                <p style={{ color: "var(--role-text-muted)" }}>
                  There are no listings for this filter yet — but vendors are arriving every day. Be the first on the next one.
                </p>
                <div className="voeq-state-actions">
                  <Link href="/become-vendor" data-testid="explore-empty-vendor" className="voeq-btn voeq-btn--primary">Be the first to post what you're selling →</Link>
                  <Link href="/for-vendors" data-testid="explore-empty-browse" className="voeq-btn voeq-btn--ghost">How it works</Link>
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
                    </div>
                  </div>
                )}
                
                {/* P-A round 17: Trending/Featured rail removed from the top of
                    Explore (user: 'featured listings no valuable' + it rendered
                    'only in parts' — a clipping horizontal scroll rail read as a
                    broken featured banner). Now: filters → grid. Nothing at top
                    that clips. */}

                {status === "success" && <RecentlyViewedRail items={recentItems} ids={recentIds} />}
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
          <Filters value={filters} onChange={setFilters} presetCategory={categoryPreset} listings={data} campus={campus} campusOptions={campusOptions} onCampusChange={setCampus} />
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
/** kobo (minor units) -> "₦6,500" with thousands separators (en-NG). */
function formatNaira(minor: number): string {
  return `₦${new Intl.NumberFormat("en-NG").format(Math.round(minor / 100))}`;
}

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
  /* P-A: respect iPhone home indicator + keep content off the very bottom */
  paddingBottom: "calc(var(--space-3) + env(safe-area-inset-bottom, 0px))",
  maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - 12px)",
  overflowY: "auto",
  boxShadow: "var(--shadow-2)",
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

