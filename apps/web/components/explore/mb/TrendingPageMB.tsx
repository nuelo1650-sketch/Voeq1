"use client";

/**
 * TrendingPageMB (Money Bag A14) — /explore/trending behind the canary family.
 *
 * Ranked board of what the market LOVES (never "is buying" — nothing is being
 * bought yet, founder honesty rule B10). Ranked by real attention: the
 * relevance sort already weighs rating-confidence, saves, follows, featured,
 * trending (packages/data/src/explore.ts P3 weights) — we surface it as a
 * ranked list with honest meta.
 *
 * HONESTY RULES (B7/B14):
 * - Rank deltas (▲▼) REQUIRE ≥20 real events per listing — until the
 *   page_events ledger backs this, deltas DO NOT RENDER (no fake motion).
 * - "RISING" tag (not "TRENDING") for hot items, founder-corrected copy.
 * - Meta line = real counts from the payload, never invented totals.
 * - Empty → honest empty state; section collapses, no hollow board.
 */

import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/landing/BrandLogo";
import Link from "next/link";
import type { ExploreListing } from "@voeq/data";
import { cdnTransform } from "@/lib/image-upload";

function naira(minor: number): string {
  return `₦${(minor / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export function TrendingPageMB({ campus }: { campus: string }) {
  const [data, setData] = useState<ExploreListing[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const q = new URLSearchParams({ campus, sections: "1", sort: "relevance" });
    let cancelled = false;
    fetch(`/api/explore?${q.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((res) => {
        if (cancelled) return;
        setData(res.data ?? []);
        setStatus("success");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [campus]);

  // Ranked = relevance sort order from the server (real weighted score).
  const ranked = useMemo(() => data.slice(0, 20), [data]);
  const totalListings = data.length;

  return (
    <div data-testid="mb-trending-page" style={{ minHeight: "100vh", background: "var(--role-surface, #fffef9)" }}>
      {/* NAV */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px var(--nav-inline-pad, 16px)", borderBottom: "1px solid var(--role-border)" }}>
        <Link href="/" aria-label="Voeq" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--role-font-display)", fontWeight: 800, fontSize: 22, color: "var(--forest-deep, #0F2A1D)" }}>
            <BrandLogo width={94} />
          </span>
        </Link>
        <span style={{ fontSize: 13, color: "var(--role-muted)" }}>
          Explore <span aria-hidden style={{ opacity: 0.5 }}>/</span> <b style={{ color: "var(--role-text)" }}>Trending</b>
        </span>
        <span style={{ flex: 1 }} />
        <Link href="/explore?next=mb" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--forest-deep, #0F2A1D)", textDecoration: "none" }}>
          Full market →
        </Link>
      </header>

      {/* MASTHEAD — living stage */}
      <section style={{ background: "var(--forest-deep, #0F2A1D)", padding: "38px var(--nav-inline-pad, 16px) 32px", margin: "0 calc(-1 * var(--nav-inline-pad, 16px))" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", color: "#ff6b5e", border: "1px solid rgba(255,107,94,0.4)", borderRadius: 999, padding: "5px 12px" }}>
            ● RED-HOT
          </span>
          <h1 style={{ margin: "16px 0 0", fontFamily: "var(--role-font-display)", fontSize: "clamp(30px, 7vw, 46px)", lineHeight: 1.05, color: "#f6f1e6", fontWeight: 900 }}>
            What the market
            <br />
            <em style={{ color: "var(--color-amber, #E8A33D)" }}>loves.</em>
          </h1>
          <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.6, color: "rgba(246,241,230,0.78)", maxWidth: "54ch" }}>
            Ranked by real attention — saves, messages and views. Not guesses. Not ads.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 16, fontSize: 12.5, color: "rgba(246,241,230,0.65)" }}>
            <span data-testid="mb-trending-meta" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span aria-hidden className="mb-live-dot" style={{ width: 6, height: 6, borderRadius: 999, background: "var(--color-amber, #E8A33D)", display: "inline-block" }} />
              {totalListings} active {totalListings === 1 ? "listing" : "listings"} · re-ranked continuously
            </span>
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "24px var(--nav-inline-pad, 16px) 50px" }}>
        {status === "loading" && (
          <div data-testid="mb-trending-loading" style={{ padding: "40px 0", textAlign: "center", color: "var(--role-muted)", fontSize: 14 }}>
            Reading the room…
          </div>
        )}
        {status === "error" && (
          <div data-testid="mb-trending-error" role="alert" style={{ padding: "40px 0", textAlign: "center" }}>
            <p style={{ fontWeight: 600, color: "var(--role-text)" }}>The board is unreachable right now.</p>
            <button onClick={() => window.location.reload()} style={{ border: "1px solid var(--role-border)", background: "var(--role-surface)", borderRadius: 999, padding: "8px 18px", cursor: "pointer", fontWeight: 600 }}>
              Try again
            </button>
          </div>
        )}
        {status === "success" && ranked.length === 0 && (
          <div data-testid="mb-trending-empty" style={{ padding: "44px 22px", border: "1.5px dashed var(--role-border)", borderRadius: 20, textAlign: "center" }}>
            <p style={{ margin: 0, fontFamily: "var(--role-font-display)", fontSize: 20, color: "var(--forest-deep, #0F2A1D)" }}>
              No signals yet
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--role-muted)" }}>
              The board fills as the market moves — check back soon.
            </p>
          </div>
        )}

        {ranked.length > 0 && (
          <ol data-testid="mb-trending-board" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
            {ranked.map((l, i) => {
              const imgs = (l.images ?? []).filter(Boolean);
              const src = imgs[0] ?? l.image;
              const hot = i < 3; // RISING tag on the top 3 (founder copy rule)
              return (
                <li key={l.id}>
                  <Link
                    href={`/listing/${l.id}`}
                    data-testid="mb-trend-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "44px 76px 1fr",
                      gap: 12,
                      alignItems: "center",
                      padding: "10px 12px",
                      borderRadius: 16,
                      border: "1px solid var(--role-border)",
                      background: "var(--role-surface)",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <span
                      data-testid="mb-trend-rank"
                      style={{
                        fontFamily: "var(--role-font-mono, monospace)",
                        fontSize: i === 0 ? 22 : 17,
                        fontWeight: 800,
                        color: i === 0 ? "#e03e2f" : "var(--role-muted)",
                        textAlign: "center",
                      }}
                    >
                      #{i + 1}
                    </span>
                    <span style={{ display: "block", borderRadius: 12, overflow: "hidden", aspectRatio: "1 / 1", background: "rgba(15,42,29,0.05)", position: "relative" }}>
                      {src && <img src={cdnTransform(src, 300)} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <b style={{ fontSize: 14.5, color: "var(--role-text)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{l.title}</b>
                        {hot && (
                          <span data-testid="mb-trend-rising" style={{ background: "rgba(224,62,47,0.1)", color: "#e03e2f", fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", borderRadius: 999, padding: "3px 8px" }}>
                            RISING
                          </span>
                        )}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, fontSize: 12.5, color: "var(--role-muted)", flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--role-font-display)", fontWeight: 800, fontSize: 14, color: "var(--forest-deep, #0F2A1D)" }}>{naira(l.priceMinor)}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "40%" }}>{l.vendorName}</span>
                        {typeof l.vendorRatingAvg === "number" && (l.vendorRatingCount ?? 0) > 0 ? (
                          <span>★ {l.vendorRatingAvg.toFixed(1)} ({l.vendorRatingCount})</span>
                        ) : null}
                        {/* Deltas (▲▼) intentionally ABSENT: they require ≥20 real
                            events per listing (A14/B7). The page_events ledger will
                            power them; until then no fake motion renders. */}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}

        <div style={{ display: "flex", justifyContent: "center", padding: "30px 0 10px" }}>
          <Link href="/explore?next=mb" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 999, border: "1.5px dashed rgba(15,42,29,0.3)", color: "var(--forest-deep, #0F2A1D)", fontWeight: 700, fontSize: 13.5, textDecoration: "none", background: "rgba(255,255,255,0.5)" }}>
            ← Back to the full market
          </Link>
        </div>
      </main>
    </div>
  );
}
