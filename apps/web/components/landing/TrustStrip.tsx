/**
 * TrustStrip — credibility band below the hero (Chunk 5).
 * Rewritten 2026-08-20 (founder): the previous version rendered mock stats
 * (6 vendors / 6 campuses / 47 connections) — fabricated numbers that lied about
 * scale. Replaced with HONEST value pillars: every item is a true, verifiable
 * property of the product, not an invented metric. No fake social proof.
 */
const PILLARS = [
  { label: "Free to browse & connect", note: "No listing fees, ever" },
  { label: "Built for campuses", note: "Starting with Nigerian universities" },
  { label: "Student to student", note: "Buyers meet sellers directly" },
] as const;

export function TrustStrip() {
  return (
    <div className="trust-strip" data-testid="trust-strip" aria-label="Why Voeq">
      {PILLARS.map((p, i) => (
        <div key={p.label} className="trust-strip-group">
          <span className="trust-strip-label">{p.label}</span>
          <span className="trust-strip-note">{p.note}</span>
          {i < PILLARS.length - 1 && (
            <span className="trust-strip-sep" aria-hidden="true">
              ·
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
