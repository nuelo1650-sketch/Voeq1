import { getMockStats } from "@voeq/data";

// TrustStrip — data-bound credibility strip below the CTA (Chunk 5).
// No literals in the render path: every number comes from getMockStats()
// (mock module; single PLACEHOLDER seam for Phase 9 real-data wiring).
// Static numbers only — no count-up / IntersectionObserver (locked spec).
export function TrustStrip() {
  const stats = getMockStats();
  const groups = [
    { value: stats.vendorCount, label: "Vendors" },
    { value: stats.campusCount, label: "Campuses" },
    { value: stats.studentConnections, label: "Student connections" },
  ];

  return (
    <div className="trust-strip" data-testid="trust-strip" aria-label="Marketplace activity">
      {groups.map((g, i) => (
        <div key={g.label} className="trust-strip-group">
          <span className="trust-strip-number">{g.value}</span>
          <span className="trust-strip-label">{g.label}</span>
          {i < groups.length - 1 && (
            <span className="trust-strip-sep" aria-hidden="true">
              ·
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
