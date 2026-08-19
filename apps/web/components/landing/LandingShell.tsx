"use client";

import { useState } from "react";
import { LandingNav } from "./LandingNav";
import { LandingHero } from "./LandingHero";
import { CampusContext } from "./CampusContext";
import { DiscoveryProposition } from "./DiscoveryProposition";
import { ContourSignature } from "./ContourSignature";
import { EntryToDiscovery } from "./EntryToDiscovery";
import { LandingFooter } from "./LandingFooter";

/**
 * LandingShell — client wrapper that owns the selected-campus state (Task B) and composes
 * the Landing surface. Keeps the LOCKED primary hierarchy intact in the center Stack
 * (Voeq -> context -> proposition -> contour -> enter); nav + footer sit OUTSIDE it.
 */
export function LandingShell() {
  const [campus, setCampus] = useState("nmu");

  return (
    <>
      <div className="landing-bg" />
      <div className="landing-atmosphere" />
      <div className="landing-surface">
        <LandingNav />
        <main
          data-testid="landing"
          style={{ minHeight: "100vh", paddingBlock: "var(--space-8)", paddingInline: "var(--space-2)" }}
        >
          <div className="landing-split">
            <div className="landing-split-left">
              <LandingHero />
              <CampusContext campus={campus} onCampusChange={setCampus} />
              <DiscoveryProposition />
              <EntryToDiscovery campus={campus} />
            </div>
            <div className="landing-split-right">
              <ContourSignature />
            </div>
          </div>
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
