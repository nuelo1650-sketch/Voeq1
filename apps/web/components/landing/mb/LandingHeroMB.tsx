"use client";

/**
 * LandingHeroMB (Money Bag A3/A4) — the v7 hero: eyebrow + serif headline
 * ("Find it. Chat it. Get it." with amber italic) + ONE crawlable <a> CTA
 * (B4 lesson: never router.push for the primary nav) + "or sell on Voeq ›"
 * + the polaroid collage of REAL listings (swipeable 390px, rotate ±2.4°).
 *
 * Honesty: collage = real /api/explore listings with real prices/campuses;
 * missing images render the contour monogram fallback — never stock photos.
 */

import Link from "next/link";
import type { ExploreListing } from "@voeq/data";
import { cdnTransform } from "@/lib/image-upload";

function naira(minor: number): string {
  return `₦${(minor / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

const TILTS = [-2.4, 1.7, -1];

export function LandingHeroMB({ listings }: { listings: ExploreListing[] }) {
  const collage = listings.slice(0, 3);

  return (
    <header
      data-testid="mb-hero"
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "30px 16px 8px",
        position: "relative",
      }}
    >
      {/* warm radial wash */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-25% -10% 25% -10%",
          pointerEvents: "none",
          background:
            "radial-gradient(45% 40% at 12% 25%, rgba(232,163,61,0.2), transparent 70%), radial-gradient(40% 35% at 90% 15%, rgba(45,90,61,0.1), transparent 70%)",
        }}
      />
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.22em",
            color: "var(--amber-dark, #D4922A)",
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            margin: 0,
          }}
        >
          <span aria-hidden style={{ width: 18, height: 2, background: "var(--color-amber, #E8A33D)", borderRadius: 2, display: "inline-block" }} />
          The student market
          <span aria-hidden style={{ width: 18, height: 2, background: "var(--color-amber, #E8A33D)", borderRadius: 2, display: "inline-block" }} />
        </p>
        <h1
          style={{
            fontFamily: "var(--role-font-display)",
            fontWeight: 900,
            color: "var(--forest-deep, #0F2A1D)",
            fontSize: "clamp(2.2rem, 10vw, 3.4rem)",
            lineHeight: 1.03,
            letterSpacing: "-0.01em",
            margin: "12px 0 10px",
          }}
        >
          Find it.
          <br />
          Chat it.
          <br />
          <em style={{ color: "var(--amber-dark, #D4922A)" }}>Get it.</em>
        </h1>
        <p style={{ color: "var(--role-muted, #4A4A4A)", fontSize: 15, maxWidth: "36ch", lineHeight: 1.6, margin: "0 auto" }}>
          The trusted voice of your campus market — who sells what, around you, right now.
        </p>
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          {/* Crawlable <a>, NOT router.push (B4) */}
          <Link
            href="/explore?next=mb"
            data-testid="mb-hero-cta"
            style={{
              background: "var(--forest-deep, #0F2A1D)",
              color: "#f6f1e6",
              borderRadius: 999,
              padding: "14px 28px",
              fontWeight: 800,
              fontSize: 15,
              boxShadow: "0 10px 24px rgba(15,42,29,0.3)",
              textDecoration: "none",
            }}
          >
            Explore the market →
          </Link>
          <Link
            href="/become-vendor"
            data-testid="mb-hero-sell"
            style={{ color: "var(--forest-deep, #0F2A1D)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}
          >
            or sell on Voeq ›
          </Link>
        </div>
      </div>

      {/* Polaroid collage — REAL listings (A4) */}
      {collage.length > 0 && (
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            data-testid="mb-hero-collage"
            style={{
              margin: "22px -16px 4px",
              padding: "8px 16px 24px",
              display: "flex",
              gap: 13,
              overflowX: "auto",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {collage.map((l, i) => {
              const imgs = (l.images ?? []).filter(Boolean);
              const src = imgs[0] ?? l.image;
              return (
                <Link
                  key={l.id}
                  href={`/listing/${l.id}`}
                  data-testid="mb-polaroid"
                  className="mb-pol"
                  style={{
                    flex: "0 0 46%",
                    maxWidth: "46%",
                    background: "#fff",
                    padding: 8,
                    borderRadius: 6,
                    boxShadow: "0 10px 26px rgba(15,42,29,0.16)",
                    transform: `rotate(${TILTS[i % TILTS.length]}deg)${i === 1 ? " translateY(9px)" : ""}`,
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                  }}
                >
                  <span style={{ display: "block", width: "100%", aspectRatio: "1 / 1", borderRadius: 3, overflow: "hidden", background: "linear-gradient(135deg,#EDE7D8,#E2DAC8)" }}>
                    {src ? (
                      <img
                        src={cdnTransform(src, 640)}
                        alt={l.title}
                        loading={i === 0 ? "eager" : "lazy"}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : null}
                  </span>
                  <span style={{ display: "block", padding: "8px 3px 0" }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "var(--forest-deep, #0F2A1D)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {l.title}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3, gap: 6 }}>
                      <span style={{ fontFamily: "var(--role-font-display)", fontWeight: 900, fontSize: 14, color: "var(--forest-deep, #0F2A1D)" }}>
                        {naira(l.priceMinor)}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--role-muted, #7A7A7A)", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                        <span
                          aria-hidden
                          className="mb-live-dot"
                          style={{ width: 6, height: 6, borderRadius: 999, background: "var(--color-amber, #E8A33D)", display: "inline-block" }}
                        />
                        {l.verified ? "verified" : "on market"}
                      </span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
          <p style={{ textAlign: "center", fontSize: 10, color: "var(--role-muted, #7A7A7A)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, marginTop: -12, paddingBottom: 6 }}>
            ← live from the market →
          </p>
        </div>
      )}
    </header>
  );
}
