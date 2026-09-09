"use client";

/**
 * FreshDrops (Money Bag A6) — forest band, live pill, big cards.
 *
 * Real-only 72h listings from sections.freshDrops (server enforces the window
 * and seed-exclusion; this component trusts the payload and renders honestly —
 * B7). Auto-advance: 9s per card (B1 marination), rail-LOCAL scroll only
 * (scrollIntoView banned, B3), user touch pauses automation 12s (B3),
 * document.hidden pauses it (B4), prefers-reduced-motion disables automation
 * entirely (B2). Empty payload → render NOTHING (section collapses, B7).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ExploreListing } from "@voeq/data";
import { cdnTransform } from "@/lib/image-upload";

function naira(minor: number): string {
  return `₦${(minor / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

const AUTO_MS = 9000; // B1: 9s marination — never faster
const PAUSE_MS = 12000; // B3: touch pauses 12s

export function FreshDrops({ drops }: { drops: ExploreListing[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(0);

  const cardWidth = useCallback((el: HTMLDivElement) => {
    const first = el.querySelector<HTMLElement>("[data-mb-drop-card]");
    return first ? first.offsetWidth + 16 : el.clientWidth;
  }, []);

  const scrollTo = useCallback(
    (i: number) => {
      const el = railRef.current;
      if (!el) return;
      const per = cardWidth(el);
      const max = Math.max(0, drops.length - 1);
      const clamped = ((i % (max + 1)) + max + 1) % (max + 1);
      el.scrollTo({ left: clamped * per, behavior: "smooth" });
      setActive(clamped);
    },
    [cardWidth, drops.length],
  );

  // Automation (B2/B3/B4): interval only when not paused/hidden/reduced-motion.
  useEffect(() => {
    if (paused || drops.length < 2) return;
    if (typeof window !== "undefined") {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
    }
    timerRef.current = setInterval(() => {
      if (document.hidden) return; // B4
      setActive((prev) => {
        const next = (prev + 1) % drops.length;
        const el = railRef.current;
        if (el) {
          const per = cardWidth(el);
          el.scrollTo({ left: next * per, behavior: "smooth" });
        }
        return next;
      });
    }, AUTO_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [paused, drops.length, cardWidth]);

  // B3: user interaction pauses automation for 12s.
  const pauseOnTouch = useCallback(() => {
    setPaused(true);
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => setPaused(false), PAUSE_MS);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (resumeRef.current) clearTimeout(resumeRef.current);
    },
    [],
  );

  if (drops.length === 0) return null; // B7: empty section collapses

  return (
    <section
      data-testid="mb-fresh-drops"
      style={{
        background: "var(--forest-deep, #0F2A1D)",
        padding: "28px 0 22px",
        margin: "0 calc(-1 * var(--nav-inline-pad, 16px))",
      }}
    >
      <div style={{ padding: "0 16px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "var(--color-amber, #E8A33D)",
                border: "1px solid rgba(232,163,61,0.45)",
                borderRadius: 999,
                padding: "4px 10px",
              }}
            >
              <span
                aria-hidden
                className="mb-live-dot"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: "var(--color-amber, #E8A33D)",
                  display: "inline-block",
                }}
              />
              FRESH DROPS
            </span>
            <h2
              style={{
                margin: "10px 0 0",
                fontFamily: "var(--role-font-display)",
                fontSize: 26,
                color: "#f6f1e6",
                lineHeight: 1.1,
              }}
            >
              Fresh drops
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 400, color: "rgba(246,241,230,0.72)", marginTop: 4 }}>
                Just listed on your campus — updates as they land
              </span>
            </h2>
          </div>
          <Link
            href="/explore?sort=newest"
            style={{ color: "var(--color-amber, #E8A33D)", fontSize: 13.5, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            See all →
          </Link>
        </div>

        <div
          ref={railRef}
          data-testid="mb-drops-rail"
          onPointerDown={pauseOnTouch}
          onWheel={pauseOnTouch}
          onScroll={(e) => {
            const el = e.currentTarget;
            const per = cardWidth(el);
            if (per > 0) {
              const idx = Math.round(el.scrollLeft / per);
              setActive((prev) => (prev === idx ? prev : Math.min(idx, drops.length - 1)));
            }
          }}
          style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            scrollSnapType: "x proximity",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            paddingBottom: 6,
            marginTop: 18,
          }}
        >
          {drops.map((l, i) => (
            <Link
              key={l.id}
              href={`/listing/${l.id}`}
              data-mb-drop-card
              style={{
                flex: "0 0 84%",
                scrollSnapAlign: "start",
                textDecoration: "none",
                color: "inherit",
                borderRadius: 18,
                overflow: "hidden",
                position: "relative",
                background: "rgba(246,241,230,0.06)",
                border: "1px solid rgba(246,241,230,0.14)",
                minHeight: 300,
                display: "block",
              }}
            >
              <div style={{ position: "relative", aspectRatio: "4 / 3", background: "rgba(246,241,230,0.08)" }}>
                {(() => {
                  const imgs = (l.images ?? []).filter(Boolean);
                  const src = imgs[0] ?? l.image;
                  return src ? (
                    <img
                      src={cdnTransform(src, 900)}
                      alt={l.title}
                      loading={i === 0 ? "eager" : "lazy"}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : null;
                })()}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(15,42,29,0.85) 0%, rgba(15,42,29,0.1) 45%, transparent 70%)",
                  }}
                />
                {typeof l.vendorRatingAvg === "number" && (l.vendorRatingCount ?? 0) > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      background: "rgba(255,254,249,0.92)",
                      color: "var(--forest-deep, #0F2A1D)",
                      fontSize: 12,
                      fontWeight: 700,
                      borderRadius: 999,
                      padding: "4px 9px",
                    }}
                  >
                    ★ {l.vendorRatingAvg.toFixed(1)}
                  </span>
                )}
              </div>
              <div style={{ padding: "12px 14px 16px" }}>
                <span style={{ fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(246,241,230,0.65)", fontWeight: 600 }}>
                  {l.vendorName}
                </span>
                <h3 style={{ margin: "4px 0 0", fontFamily: "var(--role-font-display)", fontSize: 18, color: "#f6f1e6", lineHeight: 1.25 }}>
                  {l.title}
                </h3>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                  <span style={{ fontFamily: "var(--role-font-display)", fontSize: 17, fontWeight: 700, color: "var(--color-amber, #E8A33D)" }}>
                    {naira(l.priceMinor)}
                    {typeof l.priceMaxMinor === "number" && l.priceMaxMinor > l.priceMinor
                      ? ` – ${naira(l.priceMaxMinor)}`
                      : ""}
                  </span>
                  <span
                    style={{
                      border: "1px solid rgba(232,163,61,0.5)",
                      color: "var(--color-amber, #E8A33D)",
                      borderRadius: 999,
                      padding: "6px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Message
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {drops.length > 1 && (
          <div
            data-testid="mb-drops-dots"
            style={{ display: "flex", gap: 7, justifyContent: "center", marginTop: 12 }}
          >
            {drops.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to drop ${i + 1}`}
                onClick={() => {
                  pauseOnTouch();
                  scrollTo(i);
                }}
                style={{
                  width: active === i ? 20 : 7,
                  height: 7,
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  transition: "width .4s ease, background .4s ease",
                  background: active === i ? "var(--color-amber, #E8A33D)" : "rgba(246,241,230,0.35)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
