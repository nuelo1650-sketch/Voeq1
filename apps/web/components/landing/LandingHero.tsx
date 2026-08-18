import { Grid, Column, Stack, Type } from "@voeq/ui";

/**
 * LandingHero — the arrival moment (Doc 05 A.3 / Doc 06 §2).
 * Display typography carries Voeq's name. The discovery proposition and contour
 * follow in the locked hierarchy (see Landing page). One dominant heading per viewport.
 */
export function LandingHero() {
  return (
    <Grid>
      <Column span={12}>
        <Stack space={3}>
          <Type data-testid="landing-heading" tone="display" size="display">
            Voeq
          </Type>
        </Stack>
      </Column>
    </Grid>
  );
}
