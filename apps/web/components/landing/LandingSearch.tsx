/**
 * LandingSearch — Phase B hero search (founder 2026-08-20).
 * ONE input + ONE pill button. No dropdown, no second field. Native GET form →
 * /explore?q=… (the single discover surface, VS4.10; works without hydration).
 */
export function LandingSearch() {
  return (
    <form action="/explore" method="get" className="landing-search" data-testid="landing-search" role="search">
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
