import { Type } from "@voeq/ui";

/**
 * DiscoveryProposition — the "what you can do here" message (Doc 04 PG-PUB-001).
 * Sits AFTER campus context and BEFORE contour/entry in the locked hierarchy:
 *   Voeq -> context -> discovery proposition -> contour meaning -> enter.
 */
export function DiscoveryProposition() {
  return (
    <Type data-testid="discovery-proposition" tone="muted" size="lg">
      Discover what is open near you, and connect with the people selling it.
    </Type>
  );
}
