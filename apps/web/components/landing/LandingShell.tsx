"use client";

import { LandingNav } from "./LandingNav";
import { HeroSection } from "./HeroSection";
import { LandingFooter } from "./LandingFooter";

export function LandingShell() {
  return (
    <>
      <div className="landing-surface">
        <LandingNav />
        <main data-testid="landing">
          <HeroSection />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
