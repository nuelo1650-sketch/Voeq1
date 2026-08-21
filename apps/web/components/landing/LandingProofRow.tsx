"use client";

/**
 * LandingProofRow — adapted from Steep's floating-artifact pattern, Voeq-flavored.
 * Flat white cards, hairline border, NO resting shadow (shadow only on hover).
 * Static (visible on load) — NO scroll-reveal, per the motion-discipline rule
 * (2026-08-20): entrance/load animation lives only in the hero; hero-cluster
 * supporting elements and below-the-fold content are static or hover-only.
 *
 * HONESTY RULE (founder + review): no fabricated social-proof numbers. Until the
 * data layer exposes real counts, every stat is a LABELED placeholder — never a
 * hardcoded "1,200+ listings" that never changes. Each item carries `value`
 * (real or em-dash) + `label`. When real data exists, swap the value; do NOT
 * invent one to look populated.
 */
const PROOF = [
  { value: "1", label: "campus live — NMU", real: true },
  { value: "Free", label: "to list & connect — no fees", real: true },
  { value: "—", label: "Vendors onboarding soon", real: false },
] as const;

export function LandingProofRow() {
  return (
    <div data-testid="landing-proof-row" className="landing-proof-row">
      {PROOF.map((p) => (
        <div key={p.label} className="proof-card" data-testid="proof-card">
          <span className="proof-value" data-real={p.real}>
            {p.value}
          </span>
          <span className="proof-label">{p.label}</span>
        </div>
      ))}
    </div>
  );
}
