import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { TrendingRail } from '@/components/landing/TrendingRail';
import { CategoryGrid } from '@/components/landing/CategoryGrid';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { TrustPillars } from '@/components/landing/TrustPillars';
import { ForVendorsCTA } from '@/components/landing/ForVendorsCTA';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { LandingMB } from '@/components/landing/mb/LandingMB';
import { getCurrentIdentity } from '@/lib/session';
import { mockCampusRepo } from '@voeq/data';

/**
 * Landing — GLASS-WHITE CANVAS REBUILD (2026-08-21)
 *
 * MONEY BAG CANARY (C2, D8): ?next=mb renders the v7 advertisement landing
 * (LandingMB). Absent param = the current landing, untouched. Additive —
 * zero route deletions until the founder cuts over after the canary walkthrough.
 *
 * Section hierarchy (current landing):
 *   1. Nav (sticky top)
 *   2. Hero (full-bleed with liquid glass panels)
 *   3. Trending vendors rail
 *   4. Category grid
 *   5. How it works (dark forest section)
 *   6. Trust pillars
 *   7. For vendors CTA
 *   8. Footer (wavy organic top)
 */
export default async function Landing({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  if (params.next === "mb") {
    const identity = await getCurrentIdentity();
    const verified = await mockCampusRepo.list(identity?.id);
    const campus = identity?.campus ?? verified[0]?.id ?? "NMU Okerenkoko";
    return <LandingMB campusName={campus} />;
  }

  return (
    <>
      <LandingNav />
      <main className="landing-page">
        <LandingHero />
        <TrendingRail />
        <CategoryGrid />
        <HowItWorks />
        <TrustPillars />
        {/* LANDING FAQ (2026-09-06): mounted before the final CTA — answer
            objections, then ask for the signup. */}
        <LandingFAQ />
        <ForVendorsCTA />
      </main>
    </>
  );
}
