/**
 * LandingFooter — rich, professional footer (rewritten 2026-08-20).
 * Multi-column: brand + tagline (left), link columns (Explore / Company / Legal),
 * and a bottom bar with copyright + a short "discover near you" note.
 * All destination routes are PLACEHOLDER where noted (no real pages yet).
 * Kept outside the LOCKED primary Stack so the hero hierarchy stays clean.
 *
 * testids preserved from prior version: footer-for-vendors, footer-terms,
 * footer-privacy, footer-login, footer-signup (so existing e2e stays green).
 */
import Link from "next/link";

export function LandingFooter() {
  return (
    <footer data-testid="landing-footer" className="landing-footer">
      <div className="landing-footer-inner">
        <div className="landing-footer-brand">
          <span className="landing-footer-wordmark" data-testid="footer-wordmark">
            Voeq
          </span>
          <p className="landing-footer-tagline">
            The campus marketplace. Discover what&rsquo;s open near you, and connect with the
            people selling it.
          </p>
          <p className="landing-footer-note">
            Discover near you &mdash; the marketplace for your actual location, coming to more
            campuses.
          </p>
        </div>

        <nav className="landing-footer-cols" aria-label="Footer">
          <div className="landing-footer-col">
            <h3 className="landing-footer-col-title">Explore</h3>
            <Link href="/for-vendors" data-testid="footer-for-vendors">For vendors</Link>
            <Link href="/c/food" data-testid="footer-browse">Browse listings</Link>
            <Link href="/help" data-testid="footer-help">Help center</Link>
          </div>

          <div className="landing-footer-col">
            <h3 className="landing-footer-col-title">Company</h3>
            <Link href="/about" data-testid="footer-about">About</Link>
            <Link href="/press" data-testid="footer-press">Press</Link>
            <Link href="/careers" data-testid="footer-careers">Careers</Link>
          </div>

          <div className="landing-footer-col">
            <h3 className="landing-footer-col-title">Legal</h3>
            <Link href="/terms" data-testid="footer-terms">Terms</Link>
            <Link href="/privacy" data-testid="footer-privacy">Privacy</Link>
            <Link href="/login" data-testid="footer-login">Login</Link>
            <Link href="/signup" data-testid="footer-signup">Sign up</Link>
          </div>
        </nav>
      </div>

      <div className="landing-footer-bottom">
        <span className="landing-footer-copy">&copy; {new Date().getFullYear()} Voeq. All rights reserved.</span>
        <span className="landing-footer-bottom-links">
          <Link href="/terms" data-testid="footer-terms-bottom">Terms</Link>
          <Link href="/privacy" data-testid="footer-privacy-bottom">Privacy</Link>
        </span>
      </div>
    </footer>
  );
}
