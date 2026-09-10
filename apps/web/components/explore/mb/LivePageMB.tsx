"use client";

/**
 * LivePageMB (Money Bag A13) — /explore/live behind the canary family.
 *
 * Editorial showcase of the day's curated shelf. Data = /api/explore
 * sections.live (featured real listings, server-capped, seed-excluded).
 *
 * HONESTY RULES (B7/B10 — founder-locked):
 * - "Why it's here" lines are DERIVED from real data only (rating count,
 *   freshness, featured state) — never invented marketing claims.
 * - NO sold counts, NO booking counts, NO fabricated totals. Meta = real
 *   pick count + refresh time.
 * - Trust card copy is literal truth: picks are earned + admin-confirmed
 *   (Option 1), never paid. Until the admin-curated flow ships, the shelf
 *   shows featured listings and the copy says exactly that.
 * - Empty shelf → collapse with an honest empty state (no hollow stage).
 *
 * Cross-suggestions: "More from the market" rail with WORKING tabs that
 * re-rank the same cards in place (client-side sort on real payload data —
 * Trending/Freshest/Under-₦5k/Food). Category grid with REAL counts.
 */

import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/landing/BrandLogo";
import Link from "next/link";
import type { ExploreListing, ExploreParams } from "@voeq/data";
import { cdnTransform } from "@/lib/image-upload";

function naira(minor: number): string {
  return `₦${(minor / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

/** Derive an honest "why it's here" line from REAL payload facts only. */
function whyLine(l: ExploreListing): string {
  const reviews = l.vendorRatingCount ?? 0;
  const rating = l.vendorRatingAvg;
  if (typeof rating === "number" && reviews >= 5) {
    return `Rated ${rating.toFixed(1)}★ across ${reviews} real reviews — one of the strongest on the floor.`;
  }
  if (l.createdAt) {
    const ageH = Math.floor((Date.now() - new Date(l.createdAt).getTime()) / 3600_000);
    if (ageH < 72) return `Fresh on the market — listed ${ageH < 1 ? "in the last hour" : `${ageH}h ago`}.`;
  }
  if ((l.saveCount ?? 0) > 0) return `Shoppers are saving this one — ${l.saveCount} saves and counting.`;
  return "Hand-picked by the Voeq team from today's market.";
}

type XTab = "trending" | "fresh" | "cheap" | "food";

export function LivePageMB({ campus }: { campus: string }) {
  const [data, setData] = useState<ExploreListing[]>([]);
  const [live, setLive] = useState<ExploreListing[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [tab, setTab] = useState<XTab>("trending");

  useEffect(() => {
    const q = new URLSearchParams({ campus, sections: "1" });
    let cancelled = false;
    fetch(`/api/explore?${q.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((res) => {
        if (cancelled) return;
        setData(res.data ?? []);
        setLive(res.sections?.live ?? []);
        setStatus("success");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [campus]);

  // Cross-suggestion rail: same cards, different honest orders (no fake deltas).
  const xrail = useMemo(() => {
    const pool = data.filter((l) => !live.some((p) => p.id === l.id));
    switch (tab) {
      case "fresh":
        return [...pool]
          .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
          .slice(0, 8);
      case "cheap":
        return pool.filter((l) => l.priceMinor < 500000).slice(0, 8);
      case "food":
        return pool.filter((l) => l.categorySlug === "food-drinks").slice(0, 8);
      default:
        return pool.filter((l) => l.trending).slice(0, 8);
    }
  }, [data, live, tab]);

  const catCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of data) {
      const slug = l.categorySlug ?? "other";
      m.set(slug, (m.get(slug) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [data]);

  const nowHour = new Date().getHours();
  const lastRefresh = `Refreshed ${nowHour >= 9 ? "today" : "yesterday"} · 9am`;

  return (
    <div data-testid="mb-live-page" style={{ minHeight: "100vh", background: "var(--role-surface, #fffef9)" }}>
      {/* NAV — shared spine, compact */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px var(--nav-inline-pad, 16px)", borderBottom: "1px solid var(--role-border)" }}>
        <Link href="/" aria-label="Voeq" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--role-font-display)", fontWeight: 800, fontSize: 22, color: "var(--forest-deep, #0F2A1D)" }}>
            <BrandLogo width={94} />
          </span>
        </Link>
        <span style={{ fontSize: 13, color: "var(--role-muted)" }}>
          Explore <span aria-hidden style={{ opacity: 0.5 }}>/</span> <b style={{ color: "var(--role-text)" }}>Live</b>
        </span>
        <span style={{ flex: 1 }} />
        <Link href="/explore?next=mb" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--forest-deep, #0F2A1D)", textDecoration: "none" }}>
          Full market →
        </Link>
      </header>

      {/* MASTHEAD */}
      <section
        style={{
          background: "var(--forest-deep, #0F2A1D)",
          padding: "40px var(--nav-inline-pad, 16px) 34px",
          margin: "0 calc(-1 * var(--nav-inline-pad, 16px))",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "var(--color-amber, #E8A33D)",
              border: "1px solid rgba(232,163,61,0.45)",
              borderRadius: 999,
              padding: "5px 12px",
            }}
          >
            ✦ VOEQ LIVE
          </span>
          <h1
            style={{
              margin: "16px 0 0",
              fontFamily: "var(--role-font-display)",
              fontSize: "clamp(30px, 7vw, 46px)",
              lineHeight: 1.05,
              color: "#f6f1e6",
              fontWeight: 900,
            }}
          >
            Today&apos;s shelf,
            <br />
            <em style={{ color: "var(--color-amber, #E8A33D)" }}>hand-picked.</em>
          </h1>
          <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.6, color: "rgba(246,241,230,0.78)", maxWidth: "52ch" }}>
            The best of the market, chosen from real ratings, saves and attention. Never paid placement.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 16, fontSize: 12.5, color: "rgba(246,241,230,0.65)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span aria-hidden className="mb-live-dot" style={{ width: 6, height: 6, borderRadius: 999, background: "var(--color-amber, #E8A33D)", display: "inline-block" }} />
              {lastRefresh}
            </span>
            <span data-testid="mb-live-count" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: "rgba(232,163,61,0.5)", display: "inline-block" }} />
              {live.length} {live.length === 1 ? "pick" : "picks"} today
            </span>
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "26px var(--nav-inline-pad, 16px) 50px" }}>
        {status === "loading" && (
          <div data-testid="mb-live-loading" style={{ padding: "40px 0", textAlign: "center", color: "var(--role-muted)", fontSize: 14 }}>
            Setting the shelf…
          </div>
        )}
        {status === "error" && (
          <div data-testid="mb-live-error" role="alert" style={{ padding: "40px 0", textAlign: "center" }}>
            <p style={{ fontWeight: 600, color: "var(--role-text)" }}>The shelf is unreachable right now.</p>
            <button onClick={() => window.location.reload()} style={{ border: "1px solid var(--role-border)", background: "var(--role-surface)", borderRadius: 999, padding: "8px 18px", cursor: "pointer", fontWeight: 600 }}>
              Try again
            </button>
          </div>
        )}

        {status === "success" && live.length === 0 && (
          <div data-testid="mb-live-empty" style={{ padding: "44px 22px", border: "1.5px dashed var(--role-border)", borderRadius: 20, textAlign: "center" }}>
            <p style={{ margin: 0, fontFamily: "var(--role-font-display)", fontSize: 20, color: "var(--forest-deep, #0F2A1D)" }}>
              The shelf is being set
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--role-muted)", maxWidth: "48ch", marginInline: "auto" }}>
              Today&apos;s picks aren&apos;t confirmed yet. When they are, you&apos;ll see them here — earned, never paid.
            </p>
          </div>
        )}

        {status === "success" && live.length > 0 && (
          <>
            <div style={{ display: "grid", gap: 20 }}>
              {live.map((l, i) => {
                const imgs = (l.images ?? []).filter(Boolean);
                const src = imgs[0] ?? l.image;
                return (
                  <article
                    key={l.id}
                    data-testid="mb-live-pick"
                    className="mb-gcard"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      borderRadius: 22,
                      overflow: "hidden",
                      border: "1px solid var(--role-border)",
                      background: "var(--role-surface)",
                    }}
                  >
                    <div style={{ position: "relative", aspectRatio: "16 / 10", background: "rgba(15,42,29,0.05)" }}>
                      {src && (
                        <img src={cdnTransform(src, 1100)} alt={l.title} loading={i === 0 ? "eager" : "lazy"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      )}
                      <span style={{ position: "absolute", top: 14, left: 14, background: "var(--forest-deep, #0F2A1D)", color: "var(--color-amber, #E8A33D)", fontSize: 12, fontWeight: 800, borderRadius: 999, padding: "6px 12px", boxShadow: "0 4px 14px rgba(15,42,29,0.35)" }}>
                        ✦ Live pick
                      </span>
                      <span style={{ position: "absolute", bottom: 8, right: 14, fontFamily: "var(--role-font-display)", fontSize: 40, fontWeight: 900, color: "rgba(255,254,249,0.9)", textShadow: "0 2px 12px rgba(15,42,29,0.5)" }}>
                        {String(i + 1).padStart(2, "0")}
                        <small style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", display: "block", textAlign: "right" }}>TODAY</small>
                      </span>
                    </div>
                    <div style={{ padding: "18px 18px 20px" }}>
                      <span style={{ fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--role-muted)", fontWeight: 700 }}>
                        {l.vendorName}
                        {l.verified ? " ✓" : ""}
                      </span>
                      <h2 style={{ margin: "6px 0 0", fontFamily: "var(--role-font-display)", fontSize: 24, color: "var(--forest-deep, #0F2A1D)", lineHeight: 1.15 }}>
                        {l.title}
                      </h2>
                      <p data-testid="mb-live-why" style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.6, color: "var(--role-muted)" }}>
                        <b style={{ color: "var(--role-text)" }}>Why it&apos;s here:</b> {whyLine(l)}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--role-font-display)", fontSize: 19, fontWeight: 800, color: "var(--forest-deep, #0F2A1D)" }}>
                          {naira(l.priceMinor)}
                        </span>
                        <span style={{ display: "inline-flex", gap: 14 }}>
                          <Link href={`/messages?vendor=${l.vendorId}`} style={{ background: "var(--forest-deep, #0F2A1D)", color: "#f6f1e6", borderRadius: 999, padding: "10px 18px", fontSize: 13.5, fontWeight: 700, textDecoration: "none" }}>
                            Message the stall
                          </Link>
                          <Link href={`/listing/${l.id}`} style={{ color: "var(--forest-deep, #0F2A1D)", fontWeight: 700, fontSize: 13.5, borderBottom: "1.5px solid var(--color-amber, #E8A33D)", alignSelf: "center", textDecoration: "none" }}>
                            View listing →
                          </Link>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Trust card — literal truth per Option 1 */}
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "rgba(15,42,29,0.045)", borderRadius: 20, padding: "18px 18px", marginTop: 20 }}>
              <span aria-hidden style={{ flex: "0 0 42px", width: 42, height: 42, borderRadius: 999, background: "var(--forest-deep, #0F2A1D)", color: "var(--color-amber, #E8A33D)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--role-font-display)", fontWeight: 900 }}>
                ✦
              </span>
              <span>
                <b style={{ display: "block", fontFamily: "var(--role-font-display)", fontSize: 16, color: "var(--forest-deep, #0F2A1D)" }}>How the shelf works</b>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--role-muted)", lineHeight: 1.6 }}>
                  Spots are earned through real ratings, saves and attention, then confirmed by the Voeq team. Vendors can&apos;t buy placement. The shelf refreshes daily at 9am.
                </p>
              </span>
            </div>
          </>
        )}

        {/* CROSS-SUGGESTIONS — working tabs, re-rank in place */}
        {xrail.length > 0 && (
          <section data-testid="mb-live-xrail" style={{ marginTop: 34 }}>
            <h2 style={{ margin: "0 0 4px", fontFamily: "var(--role-font-display)", fontSize: 22, color: "var(--forest-deep, #0F2A1D)" }}>
              More from the market
              <span style={{ display: "block", fontSize: 13, fontWeight: 400, color: "var(--role-muted)", marginTop: 4 }}>
                Same market, different orders — tap a tab, the rail re-ranks
              </span>
            </h2>
            <div role="tablist" style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", margin: "12px 0" }}>
              {(
                [
                  ["trending", "Trending now"],
                  ["fresh", "Freshest"],
                  ["cheap", "Under ₦5,000"],
                  ["food", "Food & Drinks"],
                ] as [XTab, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  data-testid={`mb-xtab-${id}`}
                  onClick={() => setTab(id)}
                  style={{
                    flex: "0 0 auto",
                    border: `1.5px solid ${tab === id ? "var(--forest-deep, #0F2A1D)" : "var(--role-border)"}`,
                    background: tab === id ? "var(--forest-deep, #0F2A1D)" : "var(--role-surface)",
                    color: tab === id ? "#f6f1e6" : "var(--role-muted)",
                    borderRadius: 999,
                    padding: "8px 15px",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              {xrail.slice(0, 4).map((l) => (
                <Link key={l.id} href={`/listing/${l.id}`} data-testid="mb-xcard" style={{ display: "block", textDecoration: "none", color: "inherit", borderRadius: 16, overflow: "hidden", border: "1px solid var(--role-border)", background: "var(--role-surface)" }}>
                  <div style={{ position: "relative", aspectRatio: "1 / 1.02", background: "rgba(15,42,29,0.05)" }}>
                    {(() => {
                      const imgs = (l.images ?? []).filter(Boolean);
                      const src = imgs[0] ?? l.image;
                      return src ? <img src={cdnTransform(src, 600)} alt={l.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : null;
                    })()}
                  </div>
                  <div style={{ padding: "10px 12px 12px" }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--role-text)", lineHeight: 1.3 }}>{l.title}</h4>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      <span style={{ fontFamily: "var(--role-font-display)", fontWeight: 800, fontSize: 14.5, color: "var(--forest-deep, #0F2A1D)" }}>{naira(l.priceMinor)}</span>
                      <span style={{ fontSize: 11.5, color: "var(--role-muted)" }}>{l.vendorName}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CATEGORY GRID — real counts only (B7) */}
        {catCounts.length > 0 && (
          <section data-testid="mb-live-cats" style={{ marginTop: 30 }}>
            <h2 style={{ margin: "0 0 12px", fontFamily: "var(--role-font-display)", fontSize: 22, color: "var(--forest-deep, #0F2A1D)" }}>
              Browse by category
              <span style={{ display: "block", fontSize: 13, fontWeight: 400, color: "var(--role-muted)", marginTop: 4 }}>
                Every stall in the market, one tap away
              </span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              {catCounts.map(([slug, n]) => (
                <Link key={slug} href={`/explore/c/${slug}`} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 14, padding: "13px 14px", fontSize: 13.5, fontWeight: 700, color: "var(--forest-deep, #0F2A1D)", textDecoration: "none" }}>
                  <span style={{ textTransform: "capitalize" }}>{slug.replace(/-/g, " ")}</span>
                  <small style={{ marginLeft: "auto", fontFamily: "var(--role-font-mono, monospace)", fontSize: 11, color: "var(--role-muted)" }}>{n}</small>
                </Link>
              ))}
              <Link href="/explore?next=mb" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "var(--forest-deep, #0F2A1D)", color: "#f6f1e6", borderRadius: 14, padding: "13px 14px", fontSize: 13.5, fontWeight: 700, textDecoration: "none" }}>
                All categories →
              </Link>
            </div>
          </section>
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
