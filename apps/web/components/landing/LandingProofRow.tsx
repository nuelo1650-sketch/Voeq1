"use client";

import { useReveal } from "./useReveal";

/**
 * LandingProofRow — adapted from Steep's floating-artifact pattern, Voeq-flavored.
 * Flat white cards, hairline border, NO resting shadow (shadow only on hover).
 * ENTRANCE: fades+rises as a group after the hero CTA (~1.1s) via useReveal.
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
  { value: "—", label: "vendors onboarding soon", real: false },
] as const;

export function LandingProofRow() {
  const { ref } = useReveal<HTMLDivElement>();
  return (
    <div data-testid="landing-proof-row" ref={ref} className="landing-proof-row">
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
