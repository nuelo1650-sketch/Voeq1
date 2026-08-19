"use client";

import type { ExploreListing } from "@voeq/data";
import { ListingCard } from "./ListingCard";

/** Horizontal scroll rail of trending listings (Doc 04 PG-PUB-002 "Trending on my campus"). */
export function TrendingRail({ items }: { items: ExploreListing[] }) {
  if (!items.length) return null;
  return (
    <section data-testid="trending-rail" aria-label="Trending on my campus" style={{ marginBlock: "var(--space-3)" }}>
      <h2 style={railTitle}>Trending on my campus</h2>
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
