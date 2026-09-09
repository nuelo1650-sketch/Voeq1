"use client";

/**
 * LandingNavMB (Money Bag A1/A2) — the v7 two-row nav for the MB landing.
 *
 * Row 1: BrandLogo(94) + filled forest search pill (submits to
 * /explore?next=mb&q=…) + Saved/Messages icons + signin/signup (desktop) /
 * burger (mobile). Row 2 (desktop): category links → /explore/c/[slug] +
 * ✦ Voeq Live → /explore/live + Sell pill → /become-vendor.
 *
 * Mobile (A2): logo + signin/signup + burger ONLY; drawer = search + Saved +
 * Messages. Search shape NEVER changes (B6) — same pill everywhere.
 * Icons = lucide SVG, no emoji (A23).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Menu, X, Search } from "lucide-react";

const NAV_CATS: { slug: string; label: string }[] = [
  { slug: "food-drinks", label: "Food & Drinks" },
  { slug: "fashion", label: "Fashion" },
  { slug: "hair", label: "Hair" },
  { slug: "gadgets", label: "Gadgets" },
  { slug: "pastries", label: "Pastries" },
];

export function LandingNavMB() {
  const router = useRouter();
  const [q, setQ] = useState("");
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

  const submitSearch = () => {
    const query = q.trim();
    router.push(query ? `/explore?next=mb&q=${encodeURIComponent(query)}` : "/explore?next=mb");
  };

  const pill = (compact = false) => (
    <form
      data-testid="mb-nav-search"
      onSubmit={(e) => {
        e.preventDefault();
        submitSearch();
      }}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: 9,
        background: "var(--forest-deep, #0F2A1D)",
        borderRadius: 999,
        padding: compact ? "10px 16px" : "11px 18px",
        minWidth: 0,
      }}
      role="search"
    >
      <Search size={17} style={{ flexShrink: 0, opacity: 0.85, color: "#f6f1e6" }} aria-hidden />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search the market…"
        aria-label="Search the market"
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "#f6f1e6",
          fontSize: 16,
          fontWeight: 600,
          minWidth: 0,
        }}
      />
    </form>
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
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <Link href="/" aria-label="Voeq home" style={{ flexShrink: 0, display: "inline-flex" }}>
            <span style={{ fontFamily: "var(--role-font-display)", fontWeight: 900, fontSize: 26, color: "var(--forest-deep, #0F2A1D)", lineHeight: 1 }}>
              voeq<span style={{ color: "var(--color-amber, #E8A33D)" }}>.</span>
            </span>
          </Link>

          {/* Desktop search pill */}
          <div className="mb-nav-search-desktop" style={{ flex: 1, display: "flex", minWidth: 0 }}>
            {pill()}
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            <Link
              href="/saved"
              aria-label="Saved"
              className="mb-nav-icon"
              style={{ width: 38, height: 38, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--forest-deep, #0F2A1D)" }}
            >
              <Heart size={19} />
            </Link>
            <Link
              href="/messages"
              aria-label="Messages"
              className="mb-nav-icon"
              style={{ width: 38, height: 38, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--forest-deep, #0F2A1D)" }}
            >
              <MessageCircle size={19} />
            </Link>
            <span aria-hidden style={{ width: 1, height: 22, background: "rgba(15,42,29,0.18)", margin: "0 4px" }} />
            <Link
              href="/login"
              data-testid="mb-nav-signin"
              style={{ fontSize: 14, fontWeight: 700, color: "var(--forest-deep, #0F2A1D)", textDecoration: "none", whiteSpace: "nowrap" }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              data-testid="mb-nav-signup"
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#f6f1e6",
                background: "var(--forest-deep, #0F2A1D)",
                borderRadius: 999,
                padding: "9px 18px",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Sign up
            </Link>
            <button
              aria-label="Menu"
              data-testid="mb-nav-burger"
              onClick={() => setDrawerOpen(true)}
              className="mb-nav-burger"
              style={{ width: 38, height: 38, borderRadius: 999, display: "none", alignItems: "center", justifyContent: "center", color: "var(--forest-deep, #0F2A1D)", border: "none", background: "transparent", cursor: "pointer" }}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Row 2 — desktop only */}
        <div className="mb-nav-row2" style={{ background: "var(--role-surface, #F5F1E8)", borderBottom: "1px solid rgba(15,42,29,0.08)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", gap: 4, overflowX: "auto", scrollbarWidth: "none" }}>
            {NAV_CATS.map((c) => (
              <Link
                key={c.slug}
                href={`/explore/c/${c.slug}`}
                style={{ padding: "11px 12px", fontSize: 13.5, fontWeight: 600, color: "var(--role-muted, #4A4A4A)", whiteSpace: "nowrap", textDecoration: "none" }}
              >
                {c.label}
              </Link>
            ))}
            <Link
              href="/explore/live"
              data-testid="mb-nav-live"
              style={{ padding: "11px 12px", fontSize: 13.5, fontWeight: 800, color: "var(--amber-dark, #D4922A)", whiteSpace: "nowrap", textDecoration: "none" }}
            >
              ✦ Voeq Live
            </Link>
            <Link
              href="/become-vendor"
              data-testid="mb-nav-sell"
              style={{ marginLeft: "auto", background: "var(--forest-deep, #0F2A1D)", color: "#f6f1e6", fontSize: 13, fontWeight: 800, borderRadius: 999, padding: "9px 16px", whiteSpace: "nowrap", textDecoration: "none" }}
            >
              Sell on Voeq
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile drawer (A2): search + Saved + Messages */}
      {drawerOpen && (
        <div
          data-testid="mb-nav-drawer"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            background: "rgba(15,42,29,0.35)",
          }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--role-surface, #F5F1E8)",
              borderBottom: "1px solid rgba(15,42,29,0.08)",
              padding: "14px 16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              animation: "mbReveal .35s cubic-bezier(.22,1,.36,1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--role-font-display)", fontWeight: 900, fontSize: 20, color: "var(--forest-deep, #0F2A1D)" }}>
                voeq<span style={{ color: "var(--color-amber, #E8A33D)" }}>.</span>
              </span>
              <button
                aria-label="Close menu"
                data-testid="mb-nav-drawer-close"
                onClick={() => setDrawerOpen(false)}
                style={{ width: 38, height: 38, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--forest-deep, #0F2A1D)", border: "1px solid var(--role-border)", background: "var(--role-surface)", cursor: "pointer" }}
              >
                <X size={19} />
              </button>
            </div>
            {pill(true)}
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/saved" onClick={() => setDrawerOpen(false)} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(15,42,29,0.06)", borderRadius: 12, padding: "10px 15px", fontSize: 13.5, fontWeight: 700, color: "var(--forest-deep, #0F2A1D)", textDecoration: "none" }}>
                <Heart size={16} /> Saved
              </Link>
              <Link href="/messages" onClick={() => setDrawerOpen(false)} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(15,42,29,0.06)", borderRadius: 12, padding: "10px 15px", fontSize: 13.5, fontWeight: 700, color: "var(--forest-deep, #0F2A1D)", textDecoration: "none" }}>
                <MessageCircle size={16} /> Messages
              </Link>
            </div>
            {/* Mobile drawer keeps row-2 destinations reachable */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, borderTop: "1px solid rgba(15,42,29,0.08)", paddingTop: 12 }}>
              {NAV_CATS.map((c) => (
                <Link key={c.slug} href={`/explore/c/${c.slug}`} onClick={() => setDrawerOpen(false)} style={{ fontSize: 13, fontWeight: 600, color: "var(--role-muted)", textDecoration: "none" }}>
                  {c.label}
                </Link>
              ))}
              <Link href="/explore/live" onClick={() => setDrawerOpen(false)} style={{ fontSize: 13, fontWeight: 800, color: "var(--amber-dark)", textDecoration: "none" }}>
                ✦ Voeq Live
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
