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

      <div
        data-testid="mb-live-stage"
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "1fr",
        }}
      >
        {picks.map((l, i) => {
          const imgs = (l.images ?? []).filter(Boolean);
          const src = imgs[0] ?? l.image;
          return (
            <Link
              key={l.id}
              href={`/listing/${l.id}`}
              data-testid="mb-live-card"
              style={{
                position: "relative",
                display: "block",
                borderRadius: 20,
                overflow: "hidden",
                textDecoration: "none",
                color: "inherit",
                border: "1px solid var(--role-border)",
                background: "var(--role-surface)",
              }}
            >
              <div style={{ position: "relative", aspectRatio: "16 / 9", background: "rgba(15,42,29,0.06)" }}>
                {src && (
                  <img
                    src={cdnTransform(src, 1000)}
                    alt={l.title}
                    loading={i === 0 ? "eager" : "lazy"}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                )}
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
              </div>
              <div style={{ padding: "12px 16px 16px" }}>
                <span style={{ fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--role-muted)", fontWeight: 700 }}>
                  {String(i + 1).padStart(2, "0")} · {l.vendorName}
                </span>
                <h3 style={{ margin: "4px 0 0", fontFamily: "var(--role-font-display)", fontSize: 19, color: "var(--forest-deep, #0F2A1D)" }}>
                  {l.title}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                  <span style={{ fontFamily: "var(--role-font-display)", fontSize: 16, fontWeight: 700, color: "var(--forest-deep, #0F2A1D)" }}>
                    {naira(l.priceMinor)}
                  </span>
                  {typeof l.vendorRatingAvg === "number" && (l.vendorRatingCount ?? 0) > 0 ? (
                    <span style={{ fontSize: 13, color: "var(--role-muted)", fontWeight: 600 }}>
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
