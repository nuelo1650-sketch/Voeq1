"use client";

import Link from "next/link";
import { CAMPUS_OPTIONS } from "./CampusContext";

export function LandingFinalCTA({ campus = "nmu" }: { campus?: string }) {
  const label = CAMPUS_OPTIONS.find((c) => c.id === campus)?.label ?? campus;
  return (
    <section data-testid="landing-final-cta" className="landing-section landing-final-cta">
      <h2 className="landing-final-cta-title">Ready to discover what&rsquo;s open near you?</h2>
      <Link href="/explore" data-testid="entry-discovery-final" className="landing-cta">
        Explore {label}
        <span className="cta-arrow" aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
