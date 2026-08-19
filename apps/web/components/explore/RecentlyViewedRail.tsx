"use client";

import { useEffect, useState } from "react";
import type { ExploreListing } from "@voeq/data";
import { ListingCard } from "./ListingCard";

const STORAGE_KEY = "voeq:recently-viewed";
const MAX = 8;

/**
 * RecentlyViewedRail — client-side, deduped list (Doc 04 PG-PUB-002).
 * IMPORTANT: this is CLIENT-ONLY (localStorage), NOT backend-persisted. It is a slice-local
 * convenience for the current browser and clears if the user clears storage. No server state.
 */
export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  const record = (id: string) => {
    setIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage may be unavailable */
      }
      return next;
    });
  };

  return { ids, record };
}

/** Renders the deduped recently-viewed rail from full listing data. */
export function RecentlyViewedRail({ items }: { items: ExploreListing[] }) {
  if (!items.length) return null;
  return (
    <section data-testid="recently-viewed-rail" aria-label="Recently viewed" style={{ marginBlock: "var(--space-3)" }}>
      <h2 style={railTitle}>Recently viewed</h2>
      <div style={{ display: "flex", gap: "var(--space-2)", overflowX: "auto", paddingBottom: 8 }}>
        {items.map((l) => (
          <div key={l.id} style={{ minWidth: 220, flex: "0 0 auto" }}>
            <ListingCard listing={l} />
          </div>
        ))}
      </div>
    </section>
  );
}

const railTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: "var(--role-text)",
  fontFamily: "var(--role-font-ui)",
  margin: "0 0 8px",
};
