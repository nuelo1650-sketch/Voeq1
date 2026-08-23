import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { TrendingRail } from '@/components/landing/TrendingRail';
import { CategoryGrid } from '@/components/landing/CategoryGrid';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { TrustPillars } from '@/components/landing/TrustPillars';
import { ForVendorsCTA } from '@/components/landing/ForVendorsCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';

/**
 * Landing — GLASS-WHITE CANVAS REBUILD (2026-08-21)
 * 
 * New design direction: Glass-white canvas where campus life and vendor abundance 
 * live as full-bleed photography, organized by warm amber category signals, 
 * framed in liquid-glass panels.
 * 
 * Section hierarchy:
 *   1. Nav (sticky top)
 *   2. Hero (full-bleed with liquid glass panels)
 *   3. Trending vendors rail
 *   4. Category grid
 *   5. How it works (dark forest section)
 *   6. Trust pillars
 *   7. For vendors CTA
 *   8. Footer (wavy organic top)
 */
export default function Landing() {
  return (
    <>
      <LandingNav />
      <main className="landing-page">
        <LandingHero />
        <TrendingRail />
        <CategoryGrid />
        <HowItWorks />
        <TrustPillars />
        <ForVendorsCTA />
        <LandingFooter />
      </main>
    </>
  );
}
