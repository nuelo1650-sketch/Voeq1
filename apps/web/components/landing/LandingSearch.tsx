/**
 * LandingSearch — Phase B hero search (founder 2026-08-20).
 * ONE input + ONE pill button. No dropdown, no second field. Native GET form →
 * /browse?q=… (works without hydration; degrades to a full navigation).
 * Replaces EntryToDiscovery ("Explore NMU") as the primary discovery action.
 * "Post something" ghost remains as the one secondary CTA (rendered in LandingHero).
 *
 * Styling reuses Phase A tokens: .landing-cta pill (9999px, ink→emerald hover),
 * --role-border hairline on the input. NO new colors, NO new shadow language
 * (focus uses outline, not box-shadow). Entrance motion rides the hero CTA row
 * (no new motion vocabulary). Mobile: input stacks above button, both full-width.
 */
export function LandingSearch() {
  return (
    <form action="/browse" method="get" className="landing-search" data-testid="landing-search" role="search">
      <input
        type="search"
        name="q"
        className="landing-search-input"
        data-testid="search-input"
        placeholder="Search textbooks, furniture, tickets…"
        aria-label="What are you looking for?"
        autoComplete="off"
      />
      <button type="submit" className="landing-cta" data-testid="search-submit">
        Search
      </button>
    </form>
  );
}
