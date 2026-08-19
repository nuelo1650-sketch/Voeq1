import { Type } from "@voeq/ui";

/**
 * DiscoveryProposition — the "what you can do here" message (Doc 04 PG-PUB-001).
 * Sits AFTER campus context and BEFORE contour/entry in the locked hierarchy:
 *   Voeq -> context -> discovery proposition -> contour meaning -> enter.
 * Task B Part 1.6: tagline now explicitly conveys "campus marketplace" (single line).
 */
export function DiscoveryProposition() {
  return (
    <Type data-testid="discovery-proposition" tone="muted" size="lg">
      The campus marketplace — discover what&rsquo;s open near you, and connect with the
      people selling it.
    </Type>
  );
}
