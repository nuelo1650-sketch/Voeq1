"use client";

import { useEffect, useState, useRef } from "react";
import { Search, X, MapPin, TrendingUp, Clock } from "lucide-react";
import { trackEvent } from "@/lib/track";
import type { Campus } from "@voeq/data";
import type { ExploreListing } from "@voeq/data";
import { CATEGORIES } from "./Filters";

type Section = "recent" | "trending" | "listing" | "vendor" | "category" | "campus";

interface SearchSuggestion {
  type: "vendor" | "listing" | "campus" | "category" | "recent" | "trending";
  label: string;
  subtitle?: string;
  value: string;
  section: Section;
  thumb?: string;
}

const TRENDING = [
  "Jollof rice",
  "Past questions",
  "Phone repair",
  "Hair styling",
  "Laundry",
  "Tutoring",
];

const RECENT_KEY = "voeq:recent-searches";

/**
 * SearchBar — industrial-standard search with autocomplete (K2.1 + PassA-3).
 * - Recent + Trending sections on focus/empty
 * - Live matches (Listings / Vendors / Categories) computed from real loaded data
 * - Keyboard navigation (↑↓ Enter Esc), click-outside to close
 * - Debounced (250ms)
 */
export function SearchBar({
  initial = "",
  onSearch,
  listings,
  categoryOptions,
}: {
  initial?: string;
  onSearch: (q: string) => void;
  listings?: ExploreListing[];
  /** CHIPS SEAM: resolved taxonomy (seed ∪ console DB); falls back to
   *  the static CATEGORIES export. */
  categoryOptions?: { slug: string; label: string }[];
}) {
  const cats = categoryOptions ?? CATEGORIES;
  const [value, setValue] = useState(initial);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load campus list from the server route (real Neon; no mock data in the bundle)
  useEffect(() => {
    fetch("/api/campuses/list")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { campuses?: Campus[] } | null) => {
        if (d?.campuses) setCampusList(d.campuses);
      })
      .catch(() => {
        // silent
      });
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem(RECENT_KEY);
    if (recent) {
      try {
        setRecentSearches(JSON.parse(recent).slice(0, 5));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save to recent searches
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter((q) => q !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  // Debounced search + autocomplete (PassA-3: real live matches)
  useEffect(() => {
    const t = setTimeout(() => {
      const query = value.toLowerCase().trim();

      // Empty input (focused) → show Recent + Trending
      if (query.length === 0) {
        const recents: SearchSuggestion[] = recentSearches.map((q) => ({
          type: "recent",
          label: q,
          value: q,
          section: "recent",
        }));
        const trending: SearchSuggestion[] = TRENDING.map((q) => ({
          type: "trending",
          label: q,
          value: q,
          section: "trending",
        }));
        setSuggestions([...recents, ...trending]);
        return;
      }

      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      const results: SearchSuggestion[] = [];

      // Campus suggestions (real data via repo)
      campusList.forEach((campus) => {
        if (campus.name.toLowerCase().includes(query)) {
          results.push({
            type: "campus",
            label: campus.name,
            subtitle: `${campus.city}, ${campus.state}`,
            value: campus.name,
            section: "campus",
          });
        }
      });

      // Category suggestions (real data)
      cats.forEach((cat) => {
        if (cat.label.toLowerCase().includes(query)) {
          results.push({
            type: "category",
            label: cat.label,
            subtitle: `Browse ${cat.label.toLowerCase()}`,
            value: cat.label,
            section: "category",
          });
        }
      });

      // Live listing matches (real loaded data)
      const listingHits: SearchSuggestion[] = (listings ?? [])
        .filter((l) => l.title.toLowerCase().includes(query))
        .slice(0, 4)
        .map((l) => ({
          type: "listing",
          label: l.title,
          subtitle: `₦ ${(l.priceMinor / 100).toLocaleString("en-NG")} · ${l.vendorName}`,
          value: l.title,
          section: "listing",
          thumb: l.image,
        }));

      // Live vendor matches (real loaded data, deduped by vendor name)
      const vendorMap = new Map<string, ExploreListing>();
      (listings ?? [])
        .filter((l) => l.vendorName.toLowerCase().includes(query))
        .forEach((l) => vendorMap.set(l.vendorName, l));
      const vendorHits: SearchSuggestion[] = Array.from(vendorMap.values())
        .slice(0, 3)
        .map((v) => ({
          type: "vendor",
          label: v.vendorName,
          subtitle: "Vendor",
          value: v.vendorName,
          section: "vendor",
        }));

      // "Search for..." option first
      const head: SearchSuggestion[] = [
        {
          type: "listing",
          label: `Search for "${value}"`,
          subtitle: "Search all listings and vendors",
          value: value,
          section: "listing",
        },
      ];

      setSuggestions([...head, ...results, ...listingHits, ...vendorHits].slice(0, 20));
    }, 250);
    return () => clearTimeout(t);
  }, [value, recentSearches, listings]);

  // Show recent/trending when focused with empty input (handled in the effect above
  // via the empty-query branch). Ensure the dropdown opens on focus.
  useEffect(() => {
    if (isOpen && !value.trim() && recentSearches.length === 0) {
      // Trending still shows; nothing else needed.
    }
  }, [isOpen, value, recentSearches]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex]);
        } else {
          submitSearch(value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    setValue(suggestion.value);
    saveRecentSearch(suggestion.value);
    onSearch(suggestion.value);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const submitSearch = (query: string) => {
    saveRecentSearch(query);
    // P-A round 60: search volume for admin analytics (query text NOT sent).
    trackEvent("search", { path: `/explore` });
    onSearch(query);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setValue("");
    onSearch("");
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSuggestionIcon = (s: SearchSuggestion) => {
    switch (s.type) {
      case "campus":
        return <MapPin size={16} />;
      case "recent":
        return <Clock size={16} />;
      case "trending":
        return <TrendingUp size={16} />;
      case "listing":
      case "vendor":
      case "category":
        return <Search size={16} />;
      default:
        return <Search size={16} />;
    }
  };

  // Group flat suggestions into ordered sections for rendering.
  const SECTION_ORDER: Section[] = ["listing", "campus", "category", "vendor", "recent", "trending"];
  const SECTION_TITLE: Record<Section, string> = {
    listing: "Listings",
    vendor: "Vendors",
    category: "Categories",
    campus: "Campuses",
    recent: "Recent searches",
    trending: "Trending on your campus",
  };
  const SECTION_TESTID: Record<Section, string> = {
    listing: "search-suggestion-listing",
    vendor: "search-suggestion-vendor",
    category: "search-suggestion-category",
    campus: "search-suggestion-campus",
    recent: "search-suggestion-recent",
    trending: "search-suggestion-trending",
  };

  const sections: { section: Section; items: SearchSuggestion[] }[] = [];
  for (const sec of SECTION_ORDER) {
    const items = suggestions.filter((s) => s.section === sec);
    if (items.length > 0) sections.push({ section: sec, items });
  }

  // Flat index tracker for keyboard highlight across grouped render.
  let flatIdx = -1;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <Search
          size={18}
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--role-text-muted)",
            pointerEvents: "none",
            // P-A round 45: guarantee visibility even if a global rule hides svg
            opacity: 1,
            display: "block",
            zIndex: 1,
          }}
        />
        <input
          ref={inputRef}
          data-testid="explore-search"
          type="search"
          value={value}
          placeholder="Search vendors, listings, or campus..."
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => {
            setIsOpen(true);
            e.currentTarget.style.borderColor = "var(--color-forest)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15, 42, 29, 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--role-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            padding: "12px 40px 12px 42px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--role-border)",
            background: "var(--role-surface)",
            color: "var(--role-text)",
            fontFamily: "var(--role-font-ui)",
            fontSize: "15px",
            outline: "none",
            transition: "border-color 120ms ease, box-shadow 120ms ease",
          }}
        />
        {value && (
          <button
            onClick={clearSearch}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              color: "var(--role-text-muted)",
            }}
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Autocomplete dropdown (PassA-3: grouped, real matches) */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          data-testid="search-suggestions"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--role-surface)",
            border: "1px solid var(--role-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)",
            maxHeight: 420,
            overflowY: "auto",
            zIndex: 50,
          }}
        >
          {sections.map(({ section, items }) => (
            <div key={section} data-testid={SECTION_TESTID[section]}>
              <div
                style={{
                  padding: "8px 16px 4px",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--role-text-muted)",
                  fontFamily: "var(--role-font-ui)",
                }}
              >
                {SECTION_TITLE[section]}
              </div>
              {items.map((suggestion) => {
                flatIdx += 1;
                const idx = flatIdx;
                return (
                  <button
                    key={`${suggestion.type}-${suggestion.value}-${idx}`}
                    onClick={() => selectSuggestion(suggestion)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      border: "none",
                      background: idx === selectedIndex ? "var(--role-surface-sunken)" : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      textAlign: "left",
                      borderBottom: "1px solid var(--role-border)",
                      transition: "background 80ms ease",
                    }}
                  >
                    {suggestion.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={suggestion.thumb}
                        alt=""
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div style={{ color: "var(--role-text-muted)", display: "flex", flexShrink: 0 }}>
                        {getSuggestionIcon(suggestion)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "var(--role-text)",
                          fontFamily: "var(--role-font-ui)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {suggestion.label}
                      </div>
                      {suggestion.subtitle && (
                        <div
                          style={{
                            fontSize: "13px",
                            color: "var(--role-text-muted)",
                            fontFamily: "var(--role-font-ui)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {suggestion.subtitle}
                        </div>
                      )}
                    </div>
                    {suggestion.type === "recent" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = recentSearches.filter((q) => q !== suggestion.value);
                          setRecentSearches(updated);
                          localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
                          setSuggestions((prev) => prev.filter((s) => s.value !== suggestion.value));
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: 4,
                          display: "flex",
                          color: "var(--role-text-muted)",
                        }}
                        aria-label="Remove from recent searches"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
