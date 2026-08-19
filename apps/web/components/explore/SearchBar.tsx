"use client";

import { useEffect, useState } from "react";

/** SearchBar — debounced input (250ms) that calls onSearch with the settled query. */
export function SearchBar({ initial = "", onSearch }: { initial?: string; onSearch: (q: string) => void }) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const t = setTimeout(() => onSearch(value), 250);
    return () => clearTimeout(t);
  }, [value, onSearch]);

  return (
    <input
      data-testid="explore-search"
      type="search"
      value={value}
      placeholder="Search listings…"
      onChange={(e) => setValue(e.target.value)}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: "var(--radius)",
        border: "1px solid var(--role-border)",
        background: "var(--role-surface-sunken)",
        color: "var(--role-text)",
        fontFamily: "var(--role-font-ui)",
        fontSize: "14px",
      }}
    />
  );
}
