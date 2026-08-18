import { Stack, Type, Surface } from "@voeq/ui";

/**
 * CampusContext — plumbing for where campus context will appear (Doc 04 PG-PUB-001).
 *
 * HONEST STATE: we have no campus service and no user campus yet. This block must NOT
 * claim a specific campus (e.g. "You're at X"). It establishes the SPACE where campus
 * context will render and REPRESENTS UNAVAILABLE context truthfully (neutral label +
 * non-blocking notice). Real campus data is a Phase 9 concern.
 */
export function CampusContext() {
  return (
    <Surface data-testid="campus-context" sunken>
      <Stack space={1}>
        <Type tone="accent" size="sm">
          Campus context
        </Type>
        <Type tone="muted" size="sm">
          Showing the marketplace in your area — campus selection coming soon.
        </Type>
        <Type tone="muted" size="sm">
          (Default view — no campus detected yet.)
        </Type>
      </Stack>
    </Surface>
  );
}
