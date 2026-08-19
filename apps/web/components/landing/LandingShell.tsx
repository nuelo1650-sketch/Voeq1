"use client";

import { useState } from "react";
import { Grid, Column, Stack } from "@voeq/ui";
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
      <LandingNav />
      <main
        data-testid="landing"
        style={{ minHeight: "100vh", paddingBlock: "var(--space-8)", paddingInline: "var(--space-2)" }}
      >
        <Grid>
          <Column span={12}>
            <Stack space={5}>
              <LandingHero />
              <CampusContext campus={campus} onCampusChange={setCampus} />
              <DiscoveryProposition />
              <ContourSignature />
              <EntryToDiscovery campus={campus} />
            </Stack>
          </Column>
        </Grid>
      </main>
      <LandingFooter />
    </>
  );
}
