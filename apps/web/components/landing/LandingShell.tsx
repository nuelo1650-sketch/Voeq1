"use client";

import { useState } from "react";
import { LandingNav } from "./LandingNav";
import { HeroSection } from "./HeroSection";
import { ContourSignature } from "./ContourSignature";
import { TrustStrip } from "./TrustStrip";
import { LandingFooter } from "./LandingFooter";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingCategories } from "./LandingCategories";
import { LandingFAQ } from "./LandingFAQ";
import { LandingFinalCTA } from "./LandingFinalCTA";
import { LandingProofRow } from "./LandingProofRow";

/**
 * LandingShell - client wrapper that owns the selected-campus state (Task B) and composes
 * the Landing surface. Keeps the LOCKED primary hierarchy intact in the center Stack
 * (Voeq -> proposition -> contour -> enter); nav + footer sit OUTSIDE it.
 * Proposition is inlined into LandingHero (founder directive: INLINE IT, Chunk 7).
 * NOTE: the inline "Discover what's open near [NMU]" CampusContext selector was REMOVED
 * (founder 2026-08-20) — location filtering is deferred to the "discover near you" feature
 * (the buyer's actual location), not a hero pre-filter.
 */
export function LandingShell() {
  const [_campus, _setCampus] = useState("nmu");

  return (
    <>
      <div className="landing-bg" />
      <div className="landing-surface">
        <LandingNav />
        <main
          data-testid="landing"
          style={{ minHeight: "100vh", paddingBlock: "var(--space-8)", paddingInline: "var(--space-2)" }}
        >
          <div className="landing-split">
            <div className="landing-split-left">
              <HeroSection />
              <LandingProofRow />
            </div>
            <div className="landing-split-right">
              <ContourSignature />
            </div>
          </div>
        </main>
        <TrustStrip />
        {/* Reversal of locked PG-PUB-001 (founder authorized, 2026-08-20): rich
            public landing. How-It-Works + Categories + FAQ + Final CTA compose
            below the locked hero/trust hierarchy. */}
        <LandingHowItWorks />
        <LandingCategories />
        <LandingFAQ />
        <LandingFinalCTA campus={_campus} />
        <LandingFooter />
      </div>
    </>
  );
}
