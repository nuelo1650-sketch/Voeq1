"use client";

/**
 * ExploreMB (Money Bag) — the composed MB explore floor behind the ?next=mb
 * canary. Reads /api/explore?sections=1 (ONE round-trip, D3) and composes:
 * ContextStrip → FreshDrops → LiveShelf → Trending/Under-₦5k rails →
 * GridToday (crowd-flow) → Areas band. Filter drawer = MbFilterDrawer
 * (A12), persistence = existing voeq:explore-filters (B5), campus =
 * voeq:preferred-campus (B6).
 *
 * Honesty (B7): every number on this floor comes from the payload; empty
 * sections render NOTHING; trending rail only appears when the payload has
 * trending items (server sets trending on real signals).
 */

import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/landing/BrandLogo";
import Link from "next/link";
import type { ExploreFilters, ExploreListing, ExploreParams } from "@voeq/data";
import { useExploreData } from "@/lib/useExploreData";
import { ContextStrip, type ExploreScope } from "./ContextStrip";
import { MbFilterDrawer } from "./MbFilterDrawer";
import { FreshDrops } from "./FreshDrops";
import { LiveShelf } from "./LiveShelf";
import { MbCard } from "./MbCard";

function naira(minor: number): string {
  return `₦${(minor / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

/** Short real label for a campus name/ID — raw slugs never render (founder
 *  polish 2026-09-11). "Nigeria Maritime University (Okerenkoko)" ->
 *  "NMU Okerenkoko"; slug-shaped values prettify to "NMU Okerenkoko". */
export function campusDisplay(nameOrId: string): string {
  if (!nameOrId) return "";
  const paren = nameOrId.match(/\(([^)]+)\)/);
  const core = nameOrId.replace(/\s*\([^)]+\)\s*/g, " ").trim();
  if (/^[a-z0-9-]+$/.test(nameOrId) && !core.includes(" ")) {
    return nameOrId
      .split(/[-\s]+/)
      .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(" ");
  }
  const acronym = core.split(/\s+/).filter((w) => w.length > 2).map((w) => w[0]).join("").toUpperCase();
  if (paren) return `${acronym || core} ${paren[1]}`;
  return core.length > 24 && acronym ? acronym : core;
}

export function ExploreMB({
  campus: initialCampus,
  initialQuery,
  categoryPreset,
  categoryOptions,
}: {
  campus: string;
  initialQuery?: string;
  categoryPreset?: string;
  categoryOptions: { slug: string; label: string }[];
}) {
  // B5: same persistence keys as the existing Explore — probes + behavior preserved.
  const [filters, setFiltersState] = useState<ExploreFilters>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = sessionStorage.getItem("voeq:explore-filters");
      return raw ? (JSON.parse(raw) as ExploreFilters) : {};
    } catch {
      return {};
    }
  });
  const setFilters = (next: ExploreFilters) => {
    setFiltersState(next);
    try {
      sessionStorage.setItem("voeq:explore-filters", JSON.stringify(next));
    } catch {
      /* in-memory fallback */
    }
  };

  const [query, setQuery] = useState(initialQuery ?? "");
  const [sort, setSort] = useState<string>("relevance");
  const [scope, setScope] = useState<ExploreScope>("campus");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [campusName, setCampusName] = useState(initialCampus);

  // Founder polish (2026-09-11): raw slugs must never render — resolve campus
  // IDs to REAL names via the same /api/campuses/list the picker uses.
  const [campusList, setCampusList] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/api/campuses/list")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { campuses?: { id: string; name: string }[] } | null) => {
        if (active && Array.isArray(d?.campuses)) setCampusList(d.campuses);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  // resolved from the real DB list when loaded; prettified otherwise (never a
  // raw slug on screen — CampusSelector's friendlyFallback was the precedent).
  const campusLabel = campusName
    ? campusDisplay(campusList.find((c) => c.id === campusName)?.name ?? campusName)
    : "";

  // B6: campus state machine — device memory (voeq:preferred-campus).
  // needsCampusSetup = FIRST VISIT (no stored campus): context strip sits at
  // All-Nigeria with the "Set your campus" chip (B8b polish: first visit used
  // to scope=campus on the server's hardcoded fallback — spec says all).
  const [needsCampusSetup, setNeedsCampusSetup] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("voeq:preferred-campus");
    if (stored) {
      setNeedsCampusSetup(false);
      setCampusName(stored);
      setScope("campus");
    } else {
      setNeedsCampusSetup(true);
      setCampusName("");
      setScope("all");
    }
    setIsMobile(window.matchMedia("(max-width: 767px)").matches);
  }, [initialCampus]);

  // Match count for the Apply button — computed from the last payload client-side.
  const params: ExploreParams = useMemo(
    () => ({
      campus: scope === "all" ? undefined : campusName,
      query: query || undefined,
      categoryPreset,
      sort: sort as ExploreParams["sort"],
      ...filters,
    }),
    [campusName, query, categoryPreset, sort, filters, scope],
  );

  const { status, data, sections } = useExploreDataSections(params);

  const drops = sections?.freshDrops ?? [];
  const live = sections?.live ?? [];
  const grid = sections?.grid ?? data;

  const trending = useMemo(() => data.filter((l) => l.trending), [data]);
  const under5k = useMemo(() => data.filter((l) => l.priceMinor <= 500000).slice(0, 8), [data]);

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0);

  const Rail = ({
    title,
    sub,
    items,
    testid,
    eager = false,
  }: {
    title: string;
    sub: string;
    items: ExploreListing[];
    testid: string;
    eager?: boolean;
  }) => {
    if (items.length === 0) return null; // B7 collapse
    return (
      <section data-testid={testid} style={{ padding: "26px 0 4px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--role-font-display)", fontSize: 24, color: "var(--forest-deep, #0F2A1D)", lineHeight: 1.1 }}>
            {title}
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 400, color: "var(--role-muted)", marginTop: 4 }}>{sub}</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          {items.slice(0, 4).map((l, i) => (
            <MbCard key={l.id} listing={l} revealDelay={i * 100} eager={eager && i < 2} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div data-testid="mb-explore" style={{ minHeight: "100vh" }}>
      <header
        data-testid="mb-topbar"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px var(--nav-inline-pad, 16px)",
          borderBottom: "1px solid var(--role-border)",
          background: "var(--role-surface)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <a href="/" aria-label="Voeq" data-testid="mb-wordmark" style={{ textDecoration: "none", flexShrink: 0, display: "inline-flex" }}>
          {/* A24: the real BrandLogo component — never a text wordmark. */}
          <span style={{ fontFamily: "var(--role-font-display)", fontWeight: 800, fontSize: 22, color: "var(--forest-deep, #0F2A1D)" }}>
            <BrandLogo width={94} />
          </span>
        </a>
        <input
          data-testid="mb-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={campusName ? `Search ${campusLabel}…` : "Search the market…"}
          aria-label="Search listings"
          style={{
            flex: 1,
            minWidth: 0,
            border: "1px solid var(--role-border)",
            background: "rgba(15,42,29,0.05)",
            borderRadius: 999,
            padding: "10px 16px",
            fontSize: 16,
            color: "var(--role-text)",
            outline: "none",
          }}
        />
      </header>

      <ContextStrip
        campusName={campusLabel}
        liveCount={data.length}
        scope={scope}
        onScopeChange={(s) => {
          // polished state: choosing "Campus" with none set still opens the
          // picker (first-visit machine) instead of scoping to nothing.
          if (s === "campus" && !campusName) {
            setDrawerOpen(true);
            return;
          }
          setScope(s);
        }}
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setDrawerOpen(true)}
        needsCampusSetup={needsCampusSetup}
        onSetCampus={() => setDrawerOpen(true)}
      />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 var(--nav-inline-pad, 16px) 60px" }}>
        {status === "loading" && (
          <div data-testid="mb-loading" style={{ padding: "40px 0", color: "var(--role-muted)", textAlign: "center", fontSize: 14 }}>
            Opening the market…
          </div>
        )}
        {status === "error" && (
          <div data-testid="mb-error" role="alert" style={{ padding: "40px 0", textAlign: "center" }}>
            <p style={{ color: "var(--role-text)", fontWeight: 600 }}>The market is unreachable right now.</p>
            <button onClick={() => window.location.reload()} style={{ border: "1px solid var(--role-border)", background: "var(--role-surface)", borderRadius: 999, padding: "8px 18px", cursor: "pointer", fontWeight: 600 }}>
              Try again
            </button>
          </div>
        )}

        {status === "success" && (
          <>
            <FreshDrops drops={drops} />
            <LiveShelf picks={live} />
            <Rail title="Trending this week" sub="What the market loves — real attention, measured" items={trending} testid="mb-trending" />
            <Rail title="Under ₦5,000" sub="Small prices, real finds" items={under5k} testid="mb-under5k" />

            <section data-testid="mb-grid" style={{ padding: "26px 0 4px" }}>
              <h2 style={{ margin: "0 0 14px", fontFamily: "var(--role-font-display)", fontSize: 24, color: "var(--forest-deep, #0F2A1D)" }}>
                On the grid today
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 400, color: "var(--role-muted)", marginTop: 4 }}>
                  The full market — a fair rotation, every listing gets the floor
                </span>
              </h2>
              {grid.length === 0 ? (
                <div data-testid="mb-empty" style={{ padding: "36px 20px", border: "1px dashed var(--role-border)", borderRadius: 16, textAlign: "center" }}>
                  <p style={{ margin: 0, fontFamily: "var(--role-font-display)", fontSize: 18, color: "var(--forest-deep, #0F2A1D)" }}>
                    Your campus is waking up
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--role-muted)" }}>
                    Be the first to post — your listing sets the tone for the market.
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                  {grid.map((l, i) => (
                    <MbCard key={l.id} listing={l} revealDelay={(i % 4) * 100} eager={i < 2} />
                  ))}
                </div>
              )}
            </section>

            <section data-testid="mb-areas" style={{ padding: "26px 0 8px", borderTop: "1px solid var(--role-border)", marginTop: 26 }}>
              <h3 style={{ fontFamily: "var(--role-font-display)", fontSize: 20, color: "var(--forest-deep, #0F2A1D)", margin: "18px 0 4px" }}>
                Beyond the campus gates
              </h3>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--role-muted)" }}>
                Vendors everywhere in Nigeria — browse by area.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {["delta-okerenkoko", "delta-warri", "edo-benin-city", "rivers-port-harcourt", "lagos-ikeja"].map((id) => (
                  <Link
                    key={id}
                    href={`/explore/areas/${id}`}
                    style={{ border: "1px solid var(--role-border)", borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 600, color: "var(--role-text)", textDecoration: "none", background: "var(--role-surface)" }}
                  >
                    {id.split("-")[1].replace(/^\w/, (c) => c.toUpperCase())}
                  </Link>
                ))}
                <Link href="/explore/areas/delta-okerenkoko" style={{ border: "1px solid rgba(15,42,29,0.3)", borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 700, color: "var(--forest-deep, #0F2A1D)", textDecoration: "none" }}>
                  All 36 states →
                </Link>
              </div>
            </section>
          </>
        )}
      </main>

      <MbFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onChange={setFilters}
        campus={scope === "all" ? "" : campusName}
        onCampusChange={(c) => {
          if (c) {
            setCampusName(c);
            localStorage.setItem("voeq:preferred-campus", c);
            setNeedsCampusSetup(false); // B6: campus chosen — chip goes away
            setScope("campus");
          } else {
            setScope("all");
          }
        }}
        campusOptions={
          campusList.length > 0
            ? campusList.map((c) => ({ id: c.id, name: c.name }))
            : campusName
              ? [{ id: campusName, name: campusDisplay(campusName) }]
              : []
        }
        categoryOptions={categoryOptions}
        sort={sort}
        onSortChange={setSort}
        matchCount={grid.length}
        isMobile={isMobile}
      />
    </div>
  );
}

/**
 * sections-aware data hook — extends useExploreData with the Money Bag
 * sections payload (server already returns it when sections=1; the hook
 * just carries it through, D3).
 */
import { useCallback } from "react";

interface SectionsPayload {
  freshDrops: ExploreListing[];
  live: ExploreListing[];
  grid: ExploreListing[];
}

function useExploreDataSections(params: ExploreParams): {
  status: string;
  data: ExploreListing[];
  sections?: SectionsPayload;
} {
  const [state, setState] = useState<{
    status: string;
    data: ExploreListing[];
    sections?: SectionsPayload;
  }>({ status: "loading", data: [] });

  const paramsKey = JSON.stringify(params);

  const load = useCallback(() => {
    const q = new URLSearchParams();
    if (params.campus) q.set("campus", params.campus);
    if (params.query) q.set("query", params.query);
    if (params.categoryPreset) q.set("categoryPreset", params.categoryPreset);
    if (params.category) q.set("category", params.category);
    if (params.sort) q.set("sort", params.sort);
    if (params.minPrice != null) q.set("minPrice", String(params.minPrice));
    if (params.maxPrice != null) q.set("maxPrice", String(params.maxPrice));
    if (params.verifiedOnly) q.set("verifiedOnly", "true");
    q.set("sections", "1");

    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading" }));
    fetch(`/api/explore?${q.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Explore failed (${r.status})`);
        return r.json();
      })
      .then((res) => {
        if (cancelled) return;
        setState({ status: res.status === "empty" ? "success" : res.status ?? "success", data: res.data ?? [], sections: res.sections });
      })
      .catch(() => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, status: "error" }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => load(), [load]);

  return state;
}
