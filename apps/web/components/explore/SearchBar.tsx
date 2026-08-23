"use client";

import { useEffect, useState, useRef } from "react";
import { Search, X, MapPin, TrendingUp } from "lucide-react";
import { campuses } from "@voeq/data";

interface SearchSuggestion {
  type: "vendor" | "listing" | "campus" | "category" | "recent";
  label: string;
  subtitle?: string;
  value: string;
}

/** 
 * SearchBar — Industrial-standard search with autocomplete (K2.1 enhancement).
 * Features:
 * - Autocomplete dropdown with suggestions
 * - Multi-field search (vendors, listings, campus, category)
 * - Recent searches (localStorage)
 * - Keyboard navigation (↑↓ Enter Esc)
 * - Debounced API calls (250ms)
 */
export function SearchBar({ initial = "", onSearch }: { initial?: string; onSearch: (q: string) => void }) {
  const [value, setValue] = useState(initial);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem("voeq:recentSearches");
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
    const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("voeq:recentSearches", JSON.stringify(updated));
  };

  // Debounced search + autocomplete
  useEffect(() => {
    const t = setTimeout(() => {
      if (value.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      // Generate suggestions (in real app, this would be an API call)
      const query = value.toLowerCase().trim();
      const results: SearchSuggestion[] = [];

      // Campus suggestions
      campuses.forEach(campus => {
        if (campus.name.toLowerCase().includes(query)) {
          results.push({
            type: "campus",
            label: campus.name,
            subtitle: `${campus.city}, ${campus.state}`,
            value: campus.name,
          });
        }
      });

      // Category suggestions
      const categories = ["Food", "Books", "Beauty", "Apparel", "Services"];
      categories.forEach(cat => {
        if (cat.toLowerCase().includes(query)) {
          results.push({
            type: "category",
            label: cat,
            subtitle: `Browse ${cat.toLowerCase()}`,
            value: cat,
          });
        }
      });

      // Mock vendor suggestions (in real app, fetch from API)
      if (query.includes("food") || query.includes("pizza")) {
        results.push({
          type: "vendor",
          label: "Campus Pizza Hub",
          subtitle: "Food • 4.5★",
          value: "Campus Pizza Hub",
        });
      }
      if (query.includes("book") || query.includes("text")) {
        results.push({
          type: "vendor",
          label: "TextBook Exchange",
          subtitle: "Books • 4.8★",
          value: "TextBook Exchange",
        });
      }

      // Add "Search for..." option
      if (results.length > 0 || query.length > 0) {
        results.unshift({
          type: "listing",
          label: `Search for "${value}"`,
          subtitle: "Search all listings and vendors",
          value: value,
        });
      }

      setSuggestions(results.slice(0, 8)); // Max 8 suggestions
    }, 250);
    return () => clearTimeout(t);
  }, [value]);

  // Show recent searches when focused with empty input
  useEffect(() => {
    if (isOpen && !value.trim() && recentSearches.length > 0) {
      setSuggestions(
        recentSearches.map(q => ({
          type: "recent",
          label: q,
          value: q,
        }))
      );
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
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
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

  const getSuggestionIcon = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "campus": return <MapPin size={16} />;
      case "recent": return <TrendingUp size={16} />;
      default: return <Search size={16} />;
    }
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <Search
          size={18}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--role-text-muted)",
            pointerEvents: "none",
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

      {/* Autocomplete dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--role-surface)",
            border: "1px solid var(--role-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)",
            maxHeight: 400,
            overflowY: "auto",
            zIndex: 50,
          }}
        >
          {suggestions.map((suggestion, idx) => (
            <button
              key={`${suggestion.type}-${suggestion.value}-${idx}`}
              onClick={() => selectSuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(idx)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "none",
                background: idx === selectedIndex ? "var(--role-surface-hover)" : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                textAlign: "left",
                borderBottom: idx < suggestions.length - 1 ? "1px solid var(--role-border)" : "none",
                transition: "background 80ms ease",
              }}
            >
              <div style={{ color: "var(--role-text-muted)", display: "flex", flexShrink: 0 }}>
                {getSuggestionIcon(suggestion.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--role-text)",
                  fontFamily: "var(--role-font-ui)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {suggestion.label}
                </div>
                {suggestion.subtitle && (
                  <div style={{
                    fontSize: "13px",
                    color: "var(--role-text-muted)",
                    fontFamily: "var(--role-font-ui)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {suggestion.subtitle}
                  </div>
                )}
              </div>
              {suggestion.type === "recent" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const updated = recentSearches.filter(q => q !== suggestion.value);
                    setRecentSearches(updated);
                    localStorage.setItem("voeq:recentSearches", JSON.stringify(updated));
                    setSuggestions(prev => prev.filter(s => s.value !== suggestion.value));
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
          ))}
        </div>
      )}
    </div>
  );
}
