import { CAMPUS_OPTIONS } from "./CampusContext";

/**
 * EntryToDiscovery — the ONLY primary action on Landing (Doc 04 PG-PUB-001): entry to
 * discovery. Links to /explore. Now wired to the selected campus (Task B Part 1.2):
 * "Explore {campus}". No login form, no browse grid (those are Slice 2).
 *
 * Chunk 6: primary action elevated from a plain Button to an invitation. The <a> itself
 * carries .landing-cta — no nested <button> (invalid HTML + double-interactive). Arrow is
 * aria-hidden so SR users hear only "Explore NMU".
 */
export function EntryToDiscovery({ campus = "nmu" }: { campus?: string }) {
  const label = CAMPUS_OPTIONS.find((c) => c.id === campus)?.label ?? campus;
  return (
    <a href="/explore" data-testid="entry-discovery" className="landing-cta">
      Explore {label}
      <span className="cta-arrow" aria-hidden="true">→</span>
    </a>
  );
}
