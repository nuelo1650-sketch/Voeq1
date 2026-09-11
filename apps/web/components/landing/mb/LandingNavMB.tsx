"use client";

/**
 * LandingNavMB (Money Bag — founder nav review, 2026-09-11, VARIANT B
 * "Editorial with a quiet sell"). The v7 two-row app-chrome (giant search
 * pill + category ticker + two competing pills) was too much for a page whose
 * job is one feeling and one button — search and quick links belong on
 * /explore. Founder picked variant B from money-bag/mocks/nav-v1.html.
 *
 * Single row:  BrandLogo · Explore · How it works · ✦ Voeq Live
 *              …right:  Sell on Voeq › (quiet text link)  |  Sign in · Get started
 *
 * - The sell path survives as a TEXT LINK, never a second pill fighting the
 *   primary CTA. It still routes /become-vendor (intent kept: auth fix D5).
 * - Signed-in users: quiet heart/messages icons activate (dead icons hidden
 *   from anon visitors — they bounce to /login, so we don't show a door that
 *   leads somewhere they didn't ask for; the auth pages handle redirects).
 * - Mobile (<820px): logo + Get started + burger. Drawer: Explore / How it
 *   works / ✦ Voeq Live / Sell on Voeq + account row. No search field — the
 *   drawer's first item is the market, that's the search entry.
 * - Icons = lucide SVG, no emoji (A23). BrandLogo (A24).
 */

import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/landing/BrandLogo";
import Link from "next/link";
import { Heart, MessageCircle, Menu, X } from "lucide-react";

const forest = "var(--forest-deep, #0F2A1D)";
const quiet = "var(--role-muted, #4A4A4A)";
const gold = "var(--amber-dark, #D4922A)";

export function LandingNavMB({ signedIn = false }: { signedIn?: boolean }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // A2: lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const qLink = (href: string, label: string, testid: string, goldAccent = false) => (
    <Link
      href={href}
      data-testid={testid}
      style={{
        fontSize: 14.5,
        fontWeight: goldAccent ? 800 : 600,
        color: goldAccent ? gold : quiet,
        textDecoration: "none",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = forest)}
      onMouseLeave={(e) => (e.currentTarget.style.color = goldAccent ? gold : quiet)}
    >
      {label}
    </Link>
  );

  return (
    <>
      <nav
        data-testid="mb-landing-nav"
        style={{
          background: "var(--role-surface, #F5F1E8)",
          borderBottom: "1px solid rgba(15,42,29,0.07)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 clamp(16px, 4vw, 32px)",
            height: 68,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Link href="/" aria-label="Voeq home" style={{ flexShrink: 0, display: "inline-flex", marginRight: 16 }}>
            <BrandLogo width={94} />
          </Link>

          {/* editorial links — desktop only (drawer carries them on mobile) */}
          <div className="mb-nav-links" style={{ alignItems: "center", gap: 22 }}>
            {qLink("/explore?next=mb", "Explore", "mb-nav-explore")}
            {qLink("/how-it-works", "How it works", "mb-nav-how")}
            {qLink("/explore/live", "✦ Voeq Live", "mb-nav-live", true)}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            {/* the quiet sell route — text link, never a pill */}
            <Link
              href="/become-vendor?intent=vendor"
              data-testid="mb-nav-sell"
              className="mb-nav-sell"
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: quiet,
                textDecoration: "none",
                alignItems: "center",
                gap: 4,
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = forest)}
              onMouseLeave={(e) => (e.currentTarget.style.color = quiet)}
            >
              Sell on Voeq <span aria-hidden>›</span>
            </Link>

            {signedIn ? (
              // signed-in: quiet account icons replace the auth pair
              <div style={{ display: "flex", gap: 4, alignItems: "center" }} data-testid="mb-nav-account">
                <Link href="/saved" aria-label="Saved" style={{ width: 38, height: 38, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", color: forest }}>
                  <Heart size={19} />
                </Link>
                <Link href="/messages" aria-label="Messages" style={{ width: 38, height: 38, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", color: forest }}>
                  <MessageCircle size={19} />
                </Link>
              </div>
            ) : (
              <>
                <span aria-hidden className="mb-nav-sep" style={{ width: 1, height: 22, background: "rgba(15,42,29,0.18)" }} />
                <Link
                  href="/login"
                  data-testid="mb-nav-signin"
                  className="mb-nav-signin"
                  style={{ fontSize: 14, fontWeight: 600, color: quiet, textDecoration: "none", whiteSpace: "nowrap" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = forest)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = quiet)}
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  data-testid="mb-nav-signup"
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#f6f1e6",
                    background: forest,
                    borderRadius: 999,
                    padding: "10px 20px",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Get started
                </Link>
              </>
            )}
            <button
              aria-label="Menu"
              data-testid="mb-nav-burger"
              onClick={() => setDrawerOpen(true)}
              className="mb-nav-burger"
              style={{ width: 38, height: 38, borderRadius: 10, display: "none", alignItems: "center", justifyContent: "center", color: forest, border: "none", background: "transparent", cursor: "pointer" }}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer — the editorial links live here under 820px. F-5 a11y:
          dialog semantics + Esc-to-close. */}
      {drawerOpen && (
        <div
          data-testid="mb-nav-drawer"
          style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(15,42,29,0.35)" }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            ref={(el) => {
              if (el) el.focus();
            }}
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === "Escape") setDrawerOpen(false);
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--role-surface, #F5F1E8)",
              borderBottom: "1px solid rgba(15,42,29,0.08)",
              padding: "14px 20px 20px",
              display: "flex",
              flexDirection: "column",
              animation: "mbReveal .35s cubic-bezier(.22,1,.36,1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10 }}>
              <BrandLogo width={84} />
              <button
                aria-label="Close menu"
                data-testid="mb-nav-drawer-close"
                onClick={() => setDrawerOpen(false)}
                style={{ width: 38, height: 38, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", color: forest, border: "1px solid var(--role-border, rgba(15,42,29,0.15))", background: "var(--role-surface)", cursor: "pointer" }}
              >
                <X size={19} />
              </button>
            </div>
            {(
              [
                ["/explore?next=mb", "Explore", "mb-drawer-explore", false],
                ["/how-it-works", "How it works", "mb-drawer-how", false],
                ["/explore/live", "✦ Voeq Live", "mb-drawer-live", true],
                ["/become-vendor?intent=vendor", "Sell on Voeq", "mb-drawer-sell", false],
                ...(signedIn
                  ? ([
                      ["/saved", "Saved", "mb-drawer-saved", false],
                      ["/messages", "Messages", "mb-drawer-messages", false],
                    ] as const)
                  : ([
                      ["/login", "Sign in", "mb-drawer-signin", false],
                      ["/signup", "Get started", "mb-drawer-signup", false],
                    ] as const)),
              ] as const
            ).map(([href, label, testid, accent]) => (
              <Link
                key={href}
                href={href}
                data-testid={testid}
                onClick={() => setDrawerOpen(false)}
                style={{
                  padding: "14px 2px",
                  borderBottom: "1px solid rgba(15,42,29,0.07)",
                  fontSize: 16,
                  fontWeight: accent ? 800 : 600,
                  color: accent ? gold : forest,
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/explore?next=mb"
              data-testid="mb-drawer-cta"
              onClick={() => setDrawerOpen(false)}
              style={{ marginTop: 16, background: forest, color: "#f6f1e6", fontSize: 15, fontWeight: 700, borderRadius: 999, padding: "13px 20px", textDecoration: "none", textAlign: "center" }}
            >
              Explore the market →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
