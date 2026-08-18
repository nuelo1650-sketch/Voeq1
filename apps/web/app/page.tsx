import { Grid, Column, Stack } from "@voeq/ui";
import { LandingHero } from "@/components/landing/LandingHero";
import { CampusContext } from "@/components/landing/CampusContext";
import { DiscoveryProposition } from "@/components/landing/DiscoveryProposition";
import { ContourSignature } from "@/components/landing/ContourSignature";
import { EntryToDiscovery } from "@/components/landing/EntryToDiscovery";

/**
 * Landing — PG-PUB-001 (Doc 04), Deep environment (Doc 05 A.3).
 * First real product surface. Visual hierarchy (one dominant order per viewport):
 *   Voeq (arrival) -> campus context -> discovery proposition -> contour meaning -> enter
 * No auth, no browse grid, no marketing drift, no 3D.
 */
export default function Landing() {
  return (
    <main
      data-testid="landing"
      style={{ minHeight: "100vh", paddingBlock: "var(--space-8)", paddingInline: "var(--space-2)" }}
    >
      <Grid>
        <Column span={12}>
          <Stack space={5}>
            <LandingHero />
            <CampusContext />
            <DiscoveryProposition />
            <ContourSignature />
            <EntryToDiscovery />
          </Stack>
        </Column>
      </Grid>
    </main>
  );
}
