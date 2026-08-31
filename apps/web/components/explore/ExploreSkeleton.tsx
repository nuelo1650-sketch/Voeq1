"use client";

/** ExploreSkeleton — loading state (Doc 04 PG-PUB-002): skeleton grid + rail skeletons. */
export function ExploreSkeleton() {
  return (
    <div data-testid="explore-skeleton" aria-busy="true">
      <div data-testid="skeleton-rail" style={railSkel} />
      {/* P-A fix: reuse .voeq-grid so the skeleton matches the real grid (no jump). */}
      <div data-testid="explore-skeleton-grid" className="voeq-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} data-testid="skeleton-card" style={cardSkel} />
        ))}
      </div>
    </div>
  );
}

const railSkel: React.CSSProperties = {
  height: 24,
  width: 180,
  borderRadius: 4,
  background: "var(--role-surface-sunken)",
  marginBottom: "var(--space-3)",
};

const cardSkel: React.CSSProperties = {
  aspectRatio: "3 / 4",
  borderRadius: "var(--radius-lg)",
  background: "var(--role-surface-sunken)",
};
