"use client";

/**
 * VendorSpotlightMB (Money Bag A7) — the rotating vendor stage.
 *
 * DATA HONESTY (C3): vendors come from the /api/explore payload (live
 * vendors with real listings) — the best-rated first (real vendorRatingAvg
 * with count >= 1). NO snapshot requirement, NO fabricated scores: until the
 * nightly cron (E-phase) produces vendor_score_snapshot, the spotlight is a
 * fair rotation over the real market, and the fair-note says exactly that.
 * No vendors with real listings → section collapses (B7).
 *
 * Rotation: 9s crossfade (B1 marination), ‹› arrows, pause on touch (B3),
 * document.hidden safe (B4), reduced-motion = no auto-advance (B2).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ExploreListing } from "@voeq/data";
import { cdnTransform } from "@/lib/image-upload";

const AUTO_MS = 9000;
const PAUSE_MS = 12000;

function naira(minor: number): string {
  return `₦${(minor / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

interface SpotVendor {
  vendorId: string;
  vendorName: string;
  verified: boolean;
  listing: ExploreListing;
  rating?: { avg: number; count: number };
}

export function VendorSpotlightMB({ listings }: { listings: ExploreListing[] }) {
  const vendors = useRef<SpotVendor[]>([]);
  if (vendors.current.length === 0) {
    // build once per payload change (pure derivation, no state churn)
    const byVendor = new Map<string, SpotVendor>();
    for (const l of listings) {
      const prev = byVendor.get(l.vendorId);
      const better =
        !prev ||
        (typeof l.vendorRatingAvg === "number" &&
          (typeof prev.rating?.avg !== "number" || l.vendorRatingAvg > prev.rating.avg));
      if (better) {
        byVendor.set(l.vendorId, {
          vendorId: l.vendorId,
          vendorName: l.vendorName,
          verified: Boolean(l.verified),
          listing: l,
          rating:
            typeof l.vendorRatingAvg === "number" && (l.vendorRatingCount ?? 0) > 0
              ? { avg: l.vendorRatingAvg, count: l.vendorRatingCount ?? 0 }
              : undefined,
        });
      }
    }
    vendors.current = [...byVendor.values()]
      .sort((a, b) => (b.rating?.avg ?? 0) - (a.rating?.avg ?? 0))
      .slice(0, 5);
  }

  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // F-5 (audit fix): the old deps array was [paused, idx === 0] — a boolean
  // that flips on every wrap, tearing down/rebuilding the interval. The
  // interval callback already reads vendors.current.length via the ref, so
  // [paused, vendors.current.length] is the correct minimal dep set.
  useEffect(() => {
    if (paused || vendors.current.length < 2) return;
    if (typeof window !== "undefined") {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    }
    timerRef.current = setInterval(() => {
      if (document.hidden) return;
      setIdx((i) => (i + 1) % vendors.current.length);
    }, AUTO_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, vendors.current.length]);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (resumeRef.current) clearTimeout(resumeRef.current);
    },
    [],
  );

  const pause = useCallback(() => {
    setPaused(true);
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => setPaused(false), PAUSE_MS);
  }, []);

  if (vendors.current.length === 0) return null; // B7 collapse

  const v = vendors.current[idx % vendors.current.length];
  const imgs = (v.listing.images ?? []).filter(Boolean);
  const src = imgs[0] ?? v.listing.image;

  return (
    <section data-testid="mb-spotlight" style={{ maxWidth: 1200, margin: "28px auto 0", padding: "0 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontFamily: "var(--role-font-display)", fontSize: "clamp(21px, 4.6vw, 28px)", fontWeight: 900, color: "var(--forest-deep, #0F2A1D)" }}>
          Vendor Spotlight
          <span style={{ display: "block", fontSize: 13.5, fontWeight: 500, color: "var(--role-muted, #4A4A4A)", fontFamily: "Inter, system-ui, sans-serif", marginTop: 4 }}>
            A rotating light on our vendors — every vendor gets a turn
          </span>
        </h2>
      </div>

      <div
        onPointerDown={pause}
        style={{
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 16px 36px rgba(15,42,29,0.18)",
          position: "relative",
          background: "var(--forest-deep, #0B211A)",
        }}
      >
        <div style={{ position: "relative", aspectRatio: "4 / 4.4" }}>
          {src && (
            <img
              key={v.listing.id}
              src={cdnTransform(src, 1000)}
              alt={v.listing.title}
              loading="lazy"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", animation: "mbCrossfade 1.8s ease" }}
            />
          )}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(11,33,26,0.14) 0%, transparent 32%, transparent 40%, rgba(11,33,26,0.93) 90%)",
            }}
          />
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              zIndex: 2,
              display: "inline-block",
              background: "var(--color-amber, #E8A33D)",
              color: "var(--forest-deep, #0F2A1D)",
              fontWeight: 900,
              fontSize: 10,
              letterSpacing: "0.14em",
              padding: "6px 12px",
              borderRadius: 4,
              transform: "rotate(-2deg)",
              boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
              textTransform: "uppercase",
            }}
          >
            ✦ Vendor Spotlight
          </span>

          <div style={{ position: "absolute", left: 14, right: 14, bottom: 14, zIndex: 2, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 9 }}>
              <span
                aria-hidden
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  border: "2.5px solid var(--color-amber, #E8A33D)",
                  background: "linear-gradient(135deg,#2D5A3D,#0F2A1D)",
                  color: "#f6f1e6",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--role-font-display)",
                  fontWeight: 900,
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {v.vendorName.charAt(0).toUpperCase()}
              </span>
              <span style={{ minWidth: 0 }}>
                <b style={{ display: "block", fontFamily: "var(--role-font-display)", fontSize: 17, fontWeight: 700, lineHeight: 1.1 }}>
                  {v.vendorName}
                  {v.verified ? " ✓" : ""}
                </b>
                <small style={{ fontSize: 11.5, opacity: 0.88, display: "block", marginTop: 3 }}>
                  {typeof v.rating?.avg === "number"
                    ? `★ ${v.rating.avg.toFixed(1)} from ${v.rating.count} real review${v.rating.count === 1 ? "" : "s"}`
                    : "On the market — building their first reviews"}
                </small>
              </span>
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "rgba(250,246,236,0.88)",
                background: "rgba(11,33,26,0.5)",
                border: "1px solid rgba(250,246,236,0.16)",
                borderRadius: 12,
                padding: "9px 12px",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <span style={{ minWidth: 0 }}>
                <small style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--amber-light, #F5C36A)", fontWeight: 800, display: "block" }}>
                  Today&apos;s pick
                </small>
                <b style={{ fontFamily: "var(--role-font-display)", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                  {v.listing.title}
                </b>
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{naira(v.listing.priceMinor)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
              <Link
                href={`/vendor/${v.vendorId}`}
                data-testid="mb-spotlight-visit"
                style={{ background: "var(--color-amber, #E8A33D)", color: "var(--forest-deep, #0F2A1D)", fontWeight: 800, fontSize: 12.5, borderRadius: 999, padding: "10px 16px", textDecoration: "none", whiteSpace: "nowrap" }}
              >
                Visit storefront
              </Link>
              {vendors.current.length > 1 && (
                <span style={{ display: "inline-flex", gap: 7 }}>
                  <button
                    aria-label="Previous vendor"
                    data-testid="mb-spotlight-prev"
                    onClick={() => setIdx((i) => (i - 1 + vendors.current.length) % vendors.current.length)}
                    style={{ width: 32, height: 32, borderRadius: 999, background: "rgba(11,33,26,0.55)", backdropFilter: "blur(8px)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(250,246,236,0.3)", cursor: "pointer", fontSize: 15 }}
                  >
                    ‹
                  </button>
                  <button
                    aria-label="Next vendor"
                    data-testid="mb-spotlight-next"
                    onClick={() => setIdx((i) => (i + 1) % vendors.current.length)}
                    style={{ width: 32, height: 32, borderRadius: 999, background: "rgba(11,33,26,0.55)", backdropFilter: "blur(8px)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(250,246,236,0.3)", cursor: "pointer", fontSize: 15 }}
                  >
                    ›
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 11.5, color: "var(--role-muted, #7A7A7A)", textAlign: "center", marginTop: 10 }}>
        A fair rotation over the live market — every vendor gets stage time.
      </p>
    </section>
  );
}
