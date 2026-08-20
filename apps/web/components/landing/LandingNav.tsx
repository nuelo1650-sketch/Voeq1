"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * LandingNav — slim top nav for Landing (Doc 04 PG-PUB-001 secondary nav, Task B).
 * Wordmark left, secondary links right. Sticky, uses the shared nav-geometry tokens
 * (--nav-height / --nav-inline-pad) so Explore's top bar can mirror this position
 * EXACTLY for the D.4.1 shared spatial anchor. Secondary only — never competes with
 * the LOCKED primary hierarchy (Voeq -> context -> proposition -> contour -> enter).
 *
 * Doc 05 A.19 (2026-08-19, founder): at ~375px the 6-text-link + wordmark row overflows,
 * so a hamburger -> full-screen overlay nav is REQUIRED (responsive necessity). The links
 * live in `.landing-nav-links` (inline on desktop, hidden <=768px) and are re-rendered in
 * the overlay (`.landing-nav-overlay`) toggled by the hamburger. CSS for both lives in
 * apps/web/app/globals.css (added in commit 0c47218).
 */

const NAV_LINKS = [
  { href: "/about", testid: "nav-about", label: "About" },
  { href: "/help", testid: "nav-help", label: "Help" },
  { href: "/legal", testid: "nav-legal", label: "Legal" },
  { href: "/login", testid: "nav-login", label: "Login" },
  { href: "/signup", testid: "nav-signup", label: "Sign up" },
] as const;

export function LandingNav() {
  const [open, setOpen] = useState(false);

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

      {/* Desktop: inline links (hidden <=768px via .landing-nav-links in globals.css) */}
      <div className="landing-nav-links">
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} data-testid={l.testid} style={linkStyle}>
            {l.label}
          </a>
        ))}
      </div>

      {/* Mobile: hamburger (hidden on desktop via .landing-nav-hamburger) */}
      <button
        type="button"
        data-testid="landing-nav-hamburger"
        className="landing-nav-hamburger"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
          <path d="M1 1h18M1 7h18M1 13h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Mobile full-screen overlay nav (Doc 05 A.19 REQUIRED) */}
      {open && (
        <div
          data-testid="landing-nav-overlay"
          className="landing-nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <button
            type="button"
            data-testid="landing-nav-overlay-close"
            className="landing-nav-overlay-close"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-testid={`${l.testid}-overlay`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}

const linkStyle: React.CSSProperties = {
  fontFamily: "var(--role-font-ui)",
  fontSize: "14px",
  color: "var(--role-text-muted)",
  textDecoration: "none",
};
