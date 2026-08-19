import Link from "next/link";

/**
 * LandingNav — slim top nav for Landing (Doc 04 PG-PUB-001 secondary nav, Task B).
 * Wordmark left, secondary links right. Sticky, uses the shared nav-geometry tokens
 * (--nav-height / --nav-inline-pad) so Explore's top bar can mirror this position
 * EXACTLY for the D.4.1 shared spatial anchor. Secondary only — never competes with
 * the LOCKED primary hierarchy (Voeq -> context -> proposition -> contour -> enter).
 */
export function LandingNav() {
  return (
    <nav
      data-testid="landing-nav"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        height: "var(--nav-height)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingInline: "var(--nav-inline-pad)",
        background: "var(--nav-bg)",
        borderBottom: "1px solid var(--nav-border)",
      }}
    >
      <Link
        href="/"
        data-testid="wordmark"
        style={{
          fontFamily: "var(--role-font-display)",
          fontSize: "20px",
          fontWeight: 600,
          color: "var(--role-text)",
          textDecoration: "none",
          lineHeight: 1,
        }}
      >
        Voeq
      </Link>
      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
        <a href="/about" data-testid="nav-about" style={linkStyle}>About</a>
        <a href="/help" data-testid="nav-help" style={linkStyle}>Help</a>
        <a href="/legal" data-testid="nav-legal" style={linkStyle}>Legal</a>
        <a href="/login" data-testid="nav-login" style={linkStyle}>Login</a>
        <a href="/signup" data-testid="nav-signup" style={linkStyle}>Sign up</a>
      </div>
    </nav>
  );
}

const linkStyle: React.CSSProperties = {
  fontFamily: "var(--role-font-ui)",
  fontSize: "14px",
  color: "var(--role-text-muted)",
  textDecoration: "none",
};
