/**
 * LandingFooter — slim footer (Task B Part 1). Legal + For-Vendors + auth placeholders.
 * All destination routes are PLACEHOLDER (no real pages yet) — flagged in Task B evidence.
 * Kept outside the LOCKED primary Stack so the hero hierarchy stays clean.
 */
export function LandingFooter() {
  return (
    <footer
      data-testid="landing-footer"
      style={{
        marginTop: "var(--space-8)",
        paddingBlock: "var(--space-4)",
        paddingInline: "var(--nav-inline-pad)",
        borderTop: "1px solid var(--role-border)",
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--space-3)",
        alignItems: "center",
        fontFamily: "var(--role-font-ui)",
        fontSize: "13px",
        color: "var(--role-text-muted)",
      }}
    >
      <a href="/for-vendors" data-testid="footer-for-vendors" style={linkStyle}>For vendors</a>
      <a href="/terms" data-testid="footer-terms" style={linkStyle}>Terms</a>
      <a href="/privacy" data-testid="footer-privacy" style={linkStyle}>Privacy</a>
      <a href="/login" data-testid="footer-login" style={linkStyle}>Login</a>
      <a href="/signup" data-testid="footer-signup" style={linkStyle}>Sign up</a>
      <span style={{ marginLeft: "auto" }}>© Voeq</span>
    </footer>
  );
}

const linkStyle: React.CSSProperties = {
  color: "var(--role-text-muted)",
  textDecoration: "none",
};
