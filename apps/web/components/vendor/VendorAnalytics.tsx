"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, MessageCircle, Heart, Star, Users, TrendingUp, Minus, Store } from "lucide-react";
import type { Vendor, Listing } from "@voeq/data";

/**
 * VENDOR ANALYTICS — redesigned 2026-09-04 (mock v1 GO), mobile-first.
 *
 * Replaces the flat 6-stat-cards + "—" placeholders layout:
 *   - hero views stat (forest card) + honest week-over-week trends
 *   - REAL daily bar chart (7 days from page_events, today highlighted)
 *   - Top listings ranked by real per-listing views+saves
 *   - Traffic sources from real page_events.path data
 *
 * Honest-data rules (hard): a zero is a zero; "first week" when no history;
 * the decorative date-range pills stay REMOVED (P-A round 30 — they faked
 * filtering); the "Recent activity" stub is gone (it was always empty).
 */

interface WeeklyResponse {
  week: { views: number; messages: number; saves: number; followers: number };
  prev: { views: number; messages: number; saves: number; followers: number };
  daily: Array<{ day: string; views: number }>;
  perListing: Array<{ id: string; title: string; views: number; saves: number }>;
  sources: Array<{ path: string; count: number }>;
}

interface Props {
  vendor: Vendor;
  listings: Listing[];
}

export function VendorAnalytics({ vendor }: Props) {
  const [data, setData] = useState<WeeklyResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/vendor/weekly")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: WeeklyResponse) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  const trend = (cur: number, prev: number | undefined): { text: string; up: boolean | null } => {
    if (prev === undefined || prev === 0) return cur > 0 ? { text: `${cur} this week`, up: null } : { text: "first week", up: null };
    const diff = cur - prev;
    if (diff === 0) return { text: "same as last week", up: null };
    if (diff > 0) return { text: `↑ ${diff} vs last week`, up: true };
    return { text: `↓ ${Math.abs(diff)} vs last week`, up: false };
  };

  const maxDaily = data ? Math.max(1, ...data.daily.map((d) => d.views)) : 1;
  const topListings = data ? [...data.perListing].sort((a, b) => (b.views + b.saves * 3) - (a.views + a.saves * 3)).slice(0, 5) : [];
  const totalForSource = data ? Math.max(1, data.sources.reduce((s, x) => s + x.count, 0)) : 1;
  const SOURCE_LABEL: Record<string, string> = { explore: "Explore", direct: "Direct link / share", search: "Search", other: "Other pages" };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "var(--space-3) 16px 96px" }}>
      {/* header */}
      <header style={{ marginBottom: 16 }}>
        <Link href="/vendor/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "var(--role-text-muted)", textDecoration: "none", marginBottom: 10 }}>
          ← Dashboard
        </Link>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 4vw, 30px)", margin: 0, color: "var(--color-forest)", fontWeight: 600 }}>
          Analytics
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--color-ink-muted)", margin: "4px 0 0" }}>
          {vendor.name} · last 7 days · real page_events, no fabricated numbers
        </p>
      </header>

      {error ? (
        <p data-testid="analytics-error" style={{ fontSize: 13.5, color: "var(--role-danger)" }}>
          Analytics are temporarily unavailable.
        </p>
      ) : (
        <>
          {/* stat row: hero + compact */}
          <div data-testid="analytics-stats" style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr 1fr 1fr", gap: 11, marginBottom: 13 }}>
            <div data-testid="stat-views-hero" style={{ background: "var(--color-forest)", borderRadius: 14, padding: "16px 18px", boxShadow: "0 4px 14px rgba(15,42,29,.16)", display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(243,241,234,.72)", display: "flex", alignItems: "center", gap: 6 }}>
                <Eye size={13} /> Storefront views
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 700, lineHeight: 1, marginTop: 5, color: "var(--color-amber)" }}>
                {data ? data.week.views : "…"}
              </span>
              <TrendFoot t={data ? trend(data.week.views, data.prev?.views) : null} onDark />
            </div>
            <div style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 14, padding: "14px 15px", display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--role-text-muted)", display: "flex", alignItems: "center", gap: 6 }}><MessageCircle size={13} /> Messages</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>{data ? data.week.messages : "…"}</span>
              <TrendFoot t={data ? trend(data.week.messages, data.prev?.messages) : null} />
            </div>
            <div style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 14, padding: "14px 15px", display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--role-text-muted)", display: "flex", alignItems: "center", gap: 6 }}><Heart size={13} /> Saves</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>{data ? data.week.saves : "…"}</span>
              <TrendFoot t={data ? trend(data.week.saves, data.prev?.saves) : null} />
            </div>
            <div style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 14, padding: "14px 15px", display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--role-text-muted)", display: "flex", alignItems: "center", gap: 6 }}><Users size={13} /> Followers</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>{data ? data.week.followers : "…"}</span>
              <TrendFoot t={data ? trend(data.week.followers, data.prev?.followers) : null} />
            </div>
          </div>

          {/* daily bar chart — real page_events per day */}
          <section data-testid="analytics-daily" style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 16, padding: "17px 19px", boxShadow: "0 1px 4px rgba(15,42,29,.05)", marginBottom: 13 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16.5, fontWeight: 600, margin: 0, color: "var(--color-forest)" }}>Views this week</h3>
            <p style={{ fontSize: 11.5, color: "var(--role-text-muted)", margin: "2px 0 14px" }}>Daily storefront + listing views</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 110 }}>
              {(data?.daily ?? Array.from({ length: 7 }, () => ({ day: "", views: 0 }))).map((d, i, arr) => {
                const isToday = i === arr.length - 1;
                const h = data ? Math.round((d.views / maxDaily) * 100) : 0;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 9.5, fontWeight: 600, color: "var(--role-text-muted)" }}>{data ? d.views : ""}</span>
                    <div style={{ width: "100%", height: `${Math.max(h, 3)}%`, minHeight: 4, borderRadius: "6px 6px 2px 2px", background: isToday ? "var(--color-forest)" : "var(--color-amber-soft, rgba(232,163,61,.16))", border: `1px solid ${isToday ? "var(--color-forest)" : "rgba(232,163,61,.35)"}`, borderBottom: "none" }} />
                    <span style={{ fontSize: 10.5, color: "var(--role-text-muted)", fontWeight: 500 }}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* top listings + traffic sources */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
            <section data-testid="analytics-top-listings" style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 16, padding: "16px 18px", boxShadow: "0 1px 4px rgba(15,42,29,.05)" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16.5, fontWeight: 600, margin: "0 0 10px", color: "var(--color-forest)" }}>Top listings</h3>
              {topListings.length === 0 || topListings.every((t) => t.views === 0 && t.saves === 0) ? (
                <p style={{ fontSize: 12.5, color: "var(--role-text-muted)", margin: 0, fontStyle: "italic" }}>
                  No listing activity yet — shares and Explore visits will rank here.
                </p>
              ) : (
                topListings.filter((t) => t.views > 0 || t.saves > 0).map((t, i) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 0", borderBottom: "1px dashed var(--role-border)" }}>
                    <span style={{ width: 22, height: 22, borderRadius: 7, background: "var(--color-amber-soft, rgba(232,163,61,.14))", color: "var(--color-forest)", fontSize: 11.5, fontWeight: 700, display: "grid", placeItems: "center", flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</span>
                    <span style={{ fontSize: 12, color: "var(--role-text-muted)", flexShrink: 0 }}><b style={{ color: "var(--role-text)" }}>{t.views}</b> views · <b style={{ color: "var(--role-text)" }}>{t.saves}</b> saves</span>
                  </div>
                ))
              )}
            </section>

            <section data-testid="analytics-sources" style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 16, padding: "16px 18px", boxShadow: "0 1px 4px rgba(15,42,29,.05)" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16.5, fontWeight: 600, margin: "0 0 12px", color: "var(--color-forest)" }}>Where students come from</h3>
              {!data || data.sources.length === 0 ? (
                <p style={{ fontSize: 12.5, color: "var(--role-text-muted)", margin: 0, fontStyle: "italic" }}>No traffic yet.</p>
              ) : (
                data.sources.map((s) => (
                  <div key={s.path} style={{ marginBottom: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                      <span style={{ fontWeight: 600 }}>{SOURCE_LABEL[s.path] ?? s.path}</span>
                      <span style={{ color: "var(--role-text-muted)" }}>{s.count}</span>
                    </div>
                    <div style={{ height: 8, background: "var(--color-cream)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, var(--color-forest), #16382a)", width: `${Math.max(6, Math.round((s.count / totalForSource) * 100))}%` }} />
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          {/* review insight (kept from the old honest insights) */}
          <section style={{ marginTop: 13, background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 16, padding: "15px 18px", display: "flex", gap: 11, alignItems: "flex-start" }}>
            <Star size={17} style={{ color: "var(--color-amber)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong style={{ fontSize: 13.5, color: "var(--color-forest)", display: "block" }}>Grow with reviews</strong>
              <span style={{ fontSize: 12.5, color: "var(--role-text-muted)" }}>
                Ask happy customers to review you — vendors with reviews get more Explore clicks.
              </span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function TrendFoot({ t, onDark }: { t: { text: string; up: boolean | null } | null; onDark?: boolean }) {
  if (!t) return <span style={{ height: 14 }} />;
  return (
    <span style={{ fontSize: 10.5, marginTop: 6, display: "flex", alignItems: "center", gap: 4, color: onDark ? "rgba(243,241,234,.6)" : "var(--role-text-muted)" }}>
      {t.up === true && <TrendingUp size={10} color="#7ec894" />}
      {t.up === false && <Minus size={10} />}
      {t.text}
    </span>
  );
}
