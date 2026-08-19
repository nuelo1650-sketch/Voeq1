"use client";

/** ExploreSkeleton — loading state (Doc 04 PG-PUB-002): skeleton grid + rail skeletons. */
export function ExploreSkeleton() {
  return (
    <div data-testid="explore-skeleton" aria-busy="true">
      <div data-testid="skeleton-rail" style={railSkel} />
      <div style={gridStyle}>
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

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: "var(--space-2)",
};

const cardSkel: React.CSSProperties = {
  height: 260,
  borderRadius: "var(--radius-lg)",
  background: "var(--role-surface-sunken)",
};
