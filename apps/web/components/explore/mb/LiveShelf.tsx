"use client";

/**
 * LiveShelf (Money Bag A13 data layer) — stage cards with the gold ✦ Voeq Live
 * seal. Reads sections.live (featured real listings; the server caps at 2 and
 * excludes seeds — this component trusts the payload, B7).
 *
 * Honesty: no ★ value unless the listing has real reviews; no sold counts
 * anywhere (nothing is being sold yet — founder rule). Empty → collapse (B7).
 */

import Link from "next/link";
import type { ExploreListing } from "@voeq/data";
import { cdnTransform } from "@/lib/image-upload";

function naira(minor: number): string {
  return `₦${(minor / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export function LiveShelf({ picks }: { picks: ExploreListing[] }) {
  if (picks.length === 0) return null; // B7

  return (
    <section data-testid="mb-live-shelf" style={{ padding: "30px 0 6px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--role-font-display)",
            fontSize: 26,
            color: "var(--forest-deep, #0F2A1D)",
            lineHeight: 1.1,
          }}
        >
          The Live shelf
          <span style={{ display: "block", fontSize: 13.5, fontWeight: 400, color: "var(--role-muted)", marginTop: 4 }}>
            Hand-picked by Voeq today — earned, never paid
          </span>
        </h2>
        <Link href="/explore/live" style={{ color: "var(--forest-deep, #0F2A1D)", fontSize: 13.5, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
          What is this? →
        </Link>
      </div>

      {/* VISUAL FIX (founder audit): mock .stage2 = 1-col mobile → 2-col ≥760;
          .stage-card = dark full-bleed image, id overlaid bottom. */}
      <div data-testid="mb-live-stage" className="mb-stage2">
        {picks.map((l, i) => {
          const imgs = (l.images ?? []).filter(Boolean);
          const src = imgs[0] ?? l.image;
          return (
            <Link
              key={l.id}
              href={`/listing/${l.id}`}
              data-testid="mb-live-card"
              className="mb-stage-card"
              style={{
                display: "block",
                borderRadius: 20,
                textDecoration: "none",
                color: "inherit",
                background: "#123524",
                boxShadow: "0 12px 30px rgba(15,42,29,0.35)",
              }}
            >
                {src && (
                  <img
                    src={cdnTransform(src, 1000)}
                    alt={l.title}
                    loading={i === 0 ? "eager" : "lazy"}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
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
                  data-testid="mb-live-seal"
                  style={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "var(--forest-deep, #0F2A1D)",
                    color: "var(--color-amber, #E8A33D)",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    borderRadius: 999,
                    padding: "6px 12px",
                    boxShadow: "0 4px 14px rgba(15,42,29,0.35)",
                  }}
                >
                  ✦ Voeq Live
                </span>
              {/* mock .stage-id — overlaid bottom, cream on scrim */}
              <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, zIndex: 2 }}>
                <span style={{ fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(246,241,230,0.72)", fontWeight: 700 }}>
                  {String(i + 1).padStart(2, "0")} · {l.vendorName}
                </span>
                <h3 style={{ margin: "4px 0 0", fontFamily: "var(--role-font-display)", fontSize: 19, color: "#f6f1e6", lineHeight: 1.25 }}>
                  {l.title}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                  <span style={{ fontFamily: "var(--role-font-display)", fontSize: 16, fontWeight: 700, color: "var(--color-amber, #E8A33D)" }}>
                    {naira(l.priceMinor)}
                  </span>
                  {typeof l.vendorRatingAvg === "number" && (l.vendorRatingCount ?? 0) > 0 ? (
                    <span style={{ fontSize: 13, color: "rgba(246,241,230,0.75)", fontWeight: 600 }}>
                      ★ {l.vendorRatingAvg.toFixed(1)} ({l.vendorRatingCount})
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
