"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, MessageCircle, Users, Heart, Star, Calendar, Eye } from "lucide-react";
import type { Vendor, Listing } from "@voeq/data";

/**
 * K3b.5 — Vendor analytics page component.
 * Counts only (no charts), honest data ("—" for empty), date range selector,
 * overview cards, top listings table, recent activity timeline.
 * Data is fetched live from /api/vendor/analytics (derived from real Neon records).
 */

type DateRange = "7d" | "30d" | "all";
// P-A round 30: DateRange no longer used (removed fake date-range selector).

export function VendorAnalytics({
  vendor,
  listings,
}: {
  vendor: Vendor;
  listings: Listing[];
}) {
  const [analytics, setAnalytics] = useState<{
    listingCount: number;
    reviewCount: number;
    followerCount: number;
    saveCount: number;
    ratingAvg: number;
    openNow: boolean | null;
  } | null>(null);
  // P-A round 72: real weekly numbers (page_events views + messages).
  const [weekly, setWeekly] = useState<{ views: number; messages: number }>({ views: 0, messages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/vendor/analytics")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.ok) return;
        setAnalytics({
          listingCount: d.analytics.listingCount ?? 0,
          reviewCount: d.analytics.reviewCount ?? 0,
          followerCount: d.analytics.followerCount ?? 0,
          saveCount: d.analytics.saveCount ?? 0,
          ratingAvg: d.analytics.ratingAvg ?? 0,
          openNow: d.analytics.openNow ?? null,
        });
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    // P-A round 72: real weekly metrics (views/messages from page_events).
    fetch("/api/vendor/weekly")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.ok) return;
        setWeekly({ views: d.week?.views ?? 0, messages: d.week?.messages ?? 0 });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Fall back to counts derived from props if the API hasn't resolved yet.
  const display = analytics ?? {
    listingCount: listings.length,
    reviewCount: 0,
    followerCount: 0,
    saveCount: 0,
    ratingAvg: 0,
    openNow: null,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-glass-white)", padding: "var(--space-4)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <header style={{ marginBottom: "var(--space-4)" }}>
          <Link
            href="/vendor/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--color-ink-muted)",
              textDecoration: "none",
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            ← Back to dashboard
          </Link>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, margin: 0, color: "var(--color-forest)" }}>
                Analytics
              </h1>
              <p style={{ fontSize: 16, color: "var(--color-ink-muted)", margin: 0, marginTop: 8 }}>
                Track your storefront performance
              </p>
            </div>

            {/* Date range selector */}
            {/* P-A round 30 (DATA HONESTY): removed the date-range pills — they
                were decorative (the API never receives the range; the numbers
                were always "all time"). A selector that fakes filtering is a
                lie; removed until real date-scoped analytics exist. */}
          </div>
        </header>

        {/* Overview cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "var(--space-3)",
            marginBottom: "var(--space-4)",
          }}
        >
          {/* P-A round 72 (FIX 'analytics is mock/bare'): Messages was a
              hardcoded "—" with no fetch. Pull from /api/vendor/analytics +
              /api/vendor/weekly (real page_events counts). */}
          <StatCard icon={<MessageCircle size={24} />} label="Messages" value={weekly.messages} />
          <StatCard icon={<Eye size={24} />} label="Views (7d)" value={weekly.views} />
          <StatCard icon={<Users size={24} />} label="Followers" value={display.followerCount} />
          <StatCard icon={<Heart size={24} />} label="Saves" value={display.saveCount} />
          <StatCard icon={<Star size={24} />} label="Reviews" value={display.reviewCount} />
          <StatCard
            icon={<TrendingUp size={24} />}
            label="Avg. Rating"
            value={display.ratingAvg > 0 ? display.ratingAvg.toFixed(1) : "—"}
          />
        </div>

        {/* Two column layout for tables and activity */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
          {/* Top listings */}
          <Section title="Top listings" icon={<TrendingUp size={20} />}>
            {listings.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {listings.slice(0, 5).map((listing, idx) => (
                  <div
                    key={listing.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 12,
                      background: "var(--color-glass-white)",
                      borderRadius: 8,
                      border: "1px solid var(--color-ink-subtle)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                        {listing.title}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--color-ink-muted)", marginTop: 4 }}>
                        {/* Price would be in listing if available */}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--color-forest)" }}>
                        —
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--color-ink-muted)" }}>views</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No listings yet" />
            )}
          </Section>

          {/* Recent activity */}
          <Section title="Recent activity" icon={<Calendar size={20} />}>
            <EmptyState message="No recent activity yet" />
          </Section>
        </div>

        {/* Performance insights */}
        <Section title="Performance insights" icon={<TrendingUp size={20} />}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {display.reviewCount === 0 && listings.length > 0 && (
              <Insight
                type="tip"
                title="Encourage reviews"
                message="Ask satisfied customers to leave reviews to build trust with new students"
              />
            )}
            {display.followerCount < 10 && (
              <Insight
                type="tip"
                title="Grow your following"
                message="Share your social links and engage with students to gain more followers"
              />
            )}
            {display.followerCount === 0 && display.saveCount === 0 && display.reviewCount === 0 && (
              <EmptyState message="Performance insights will appear here as you gain activity" />
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

// Reusable components
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div
      style={{
        background: "var(--color-cream)",
        border: "1px solid var(--color-ink-subtle)",
        borderRadius: 12,
        padding: "var(--space-3)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ color: "var(--color-forest-mid)" }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: 32, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-forest)" }}>
          {/* P-A round 72: 0 is a REAL number — show it. The old rule
              (value === 0 ? "—") hid live zeroes as dashes, making the page
              look like mock/empty data when it was just an honest 0. */}
          {value}
        </p>
        <p style={{ margin: 0, fontSize: 14, color: "var(--color-ink-muted)", marginTop: 4 }}>{label}</p>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--color-cream)",
        border: "1px solid var(--color-ink-subtle)",
        borderRadius: 12,
        padding: "var(--space-4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "var(--space-3)" }}>
        <div style={{ color: "var(--color-forest-mid)" }}>{icon}</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: 0, color: "var(--color-forest)" }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "var(--space-4)",
        textAlign: "center",
        color: "var(--color-ink-muted)",
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}

function Insight({
  type,
  title,
  message,
}: {
  type: "info" | "tip" | "warning";
  title: string;
  message: string;
}) {
  const colors = {
    info: { bg: "#DBEAFE", text: "#1E40AF" },
    tip: { bg: "#D1FAE5", text: "#065F46" },
    warning: { bg: "#FEF3C7", text: "#92400E" },
  };

  return (
    <div
      style={{
        padding: "var(--space-3)",
        background: colors[type].bg,
        color: colors[type].text,
        borderRadius: 8,
      }}
    >
      <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{title}</p>
      <p style={{ margin: 0, fontSize: 13, marginTop: 4 }}>{message}</p>
    </div>
  );
}


