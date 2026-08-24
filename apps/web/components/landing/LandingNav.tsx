"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { BrandLogo } from './BrandLogo';

/**
 * LandingNav — slim top nav for Landing (Doc 04 PG-PUB-001 secondary nav, Task B).
 * Wordmark left, auth CTAs right. Sticky, uses the shared nav-geometry tokens
 * (--nav-height / --nav-inline-pad) so Explore's top bar can mirror this position
 * EXACTLY for the D.4.1 shared spatial anchor. Secondary only — never competes with
 * the LOCKED primary hierarchy (Voeq -> context -> proposition -> contour -> enter).
 *
 * K1.4: Shows "Sign in" + "Get started" when unauthed. When authed, shows messages + avatar.
 */

export function LandingNav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean>(false); // Default to false for immediate render
  const [unreadCount, setUnreadCount] = useState(0);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Check auth status on mount
  useEffect(() => {
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(data => {
        setIsAuthed(data.authenticated || false);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => setIsAuthed(false));
  }, []);

  const handleGetStarted = () => {
    router.push(isAuthed ? '/home' : '/signup');
  };

  // Close overlay + restore focus to the hamburger (keyboard/SR users don't lose place).
  const close = () => {
    setOpen(false);
    hamburgerRef.current?.focus();
  };

  // Focus trap: on open, focus first link; Escape closes; Tab/Shift+Tab cycle within overlay.
  useEffect(() => {
    if (!open) return;
    const el = document.querySelector<HTMLElement>('[data-testid="landing-nav-overlay"]');
    if (!el) return;
    const focusables = () =>
      Array.from(el.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
    focusables()[0]?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [open]);

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
        aria-label="Voeq"
        style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
      >
        <BrandLogo width={94} />
      </Link>

      {/* Desktop: auth buttons (hidden <=768px) */}
      <div className="landing-nav-links">
        {isAuthed ? (
          <>
            {/* Messages bell with badge */}
            <Link
              href="/messages"
              data-testid="nav-messages"
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                color: "var(--role-text-muted)",
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background: "var(--color-amber)",
                    color: "var(--color-forest)",
                    fontSize: "10px",
                    fontWeight: 600,
                    borderRadius: 999,
                    padding: "2px 5px",
                    minWidth: "16px",
                    textAlign: "center",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
            {/* Avatar dropdown - simplified for now */}
            <Link
              href="/settings"
              data-testid="nav-settings"
              style={{
                fontFamily: "var(--role-font-ui)",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--role-text-muted)",
                textDecoration: "none",
              }}
            >
              Settings
            </Link>
          </>
        ) : (
          <>
            {/* Unauthed: Sign in (text link) + Get started (amber button) */}
            <Link
              href="/login"
              data-testid="nav-signin"
              style={{
                fontFamily: "var(--role-font-ui)",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--color-ink-muted)",
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
            <button
              onClick={handleGetStarted}
              data-testid="nav-get-started"
              className="landing-cta landing-cta--sm"
            >
              Get started
            </button>
          </>
        )}
      </div>

      {/* Mobile: hamburger (hidden on desktop) */}
      <button
        type="button"
        ref={hamburgerRef}
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

      {/* Mobile full-screen overlay nav */}
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
            onClick={close}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          {isAuthed ? (
            <>
              <Link href="/home" onClick={() => setOpen(false)}>Home</Link>
              <Link href="/messages" onClick={() => setOpen(false)}>Messages</Link>
              <Link href="/settings" onClick={() => setOpen(false)}>Settings</Link>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
              <button onClick={() => { handleGetStarted(); setOpen(false); }} className="landing-cta landing-cta--sm">
                Get started
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
