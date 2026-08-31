"use client";

import type { ExploreListing } from "@voeq/data";
import { ListingCard } from "./ListingCard";

/** Horizontal scroll rail of trending listings (Doc 04 PG-PUB-002 "Trending on my campus"). */
export function TrendingRail({ items }: { items: ExploreListing[] }) {
  if (!items.length) return null;
  return (
    <section data-testid="trending-rail" aria-label="Trending on my campus" style={{ marginBlock: "var(--space-3)" }}>
      <h2 className="voeq-rail-title">Trending on my campus</h2>
      <div className="voeq-rail">
        {items.map((l) => (
          <div key={l.id}>
            <ListingCard listing={l} />
          </div>
        ))}
      </div>
    </section>
  );
}
