import { Button } from "@voeq/ui";

/**
 * EntryToDiscovery — the ONLY primary action on Landing (Doc 04 PG-PUB-001):
 * entry to discovery. Links to /explore. No login form, no browse grid (those are
 * Slice 2). Native navigation only; no auth wall.
 */
export function EntryToDiscovery() {
  return (
    <a href="/explore" data-testid="entry-discovery" style={{ textDecoration: "none" }}>
      <Button variant="primary">Explore the marketplace</Button>
    </a>
  );
}
