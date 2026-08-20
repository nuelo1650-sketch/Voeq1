/**
 * LandingFooter — slim footer (Task B Part 1). Legal + For-Vendors + auth placeholders.
 * All destination routes are PLACEHOLDER (no real pages yet) — flagged in Task B evidence.
 * Kept outside the LOCKED primary Stack so the hero hierarchy stays clean.
 *
 * Chunk 6: redesigned from a left-aligned utility strip to a centered editorial signature —
 * contour line on top, middot-separated centered links, copyright below. All 5 link testids
 * preserved.
 */
export function LandingFooter() {
  return (
    <footer data-testid="landing-footer" className="landing-footer">
      <svg
        className="landing-footer-contour"
        viewBox="0 0 100 1"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 0.5 L100 0.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="landing-footer-links">
        <a href="/for-vendors" data-testid="footer-for-vendors">For vendors</a>
        <span className="landing-footer-sep" aria-hidden="true">·</span>
        <a href="/terms" data-testid="footer-terms">Terms</a>
        <span className="landing-footer-sep" aria-hidden="true">·</span>
        <a href="/privacy" data-testid="footer-privacy">Privacy</a>
        <span className="landing-footer-sep" aria-hidden="true">·</span>
        <a href="/login" data-testid="footer-login">Login</a>
        <span className="landing-footer-sep" aria-hidden="true">·</span>
        <a href="/signup" data-testid="footer-signup">Sign up</a>
      </div>
      <div className="landing-footer-copy">© Voeq</div>
    </footer>
  );
}
