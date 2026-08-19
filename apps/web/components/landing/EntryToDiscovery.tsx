import { Button } from "@voeq/ui";
import { CAMPUS_OPTIONS } from "./CampusContext";

/**
 * EntryToDiscovery — the ONLY primary action on Landing (Doc 04 PG-PUB-001): entry to
 * discovery. Links to /explore. Now wired to the selected campus (Task B Part 1.2):
 * "Explore {campus}". No login form, no browse grid (those are Slice 2).
 */
export function EntryToDiscovery({ campus = "nmu" }: { campus?: string }) {
  const label = CAMPUS_OPTIONS.find((c) => c.id === campus)?.label ?? campus;
  return (
    <a href="/explore" data-testid="entry-discovery" style={{ textDecoration: "none" }}>
      <Button variant="primary">Explore {label}</Button>
    </a>
  );
}
