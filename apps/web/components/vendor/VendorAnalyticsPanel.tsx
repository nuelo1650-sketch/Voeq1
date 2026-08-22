"use client";

import { useEffect, useState } from "react";

interface Analytics {
  vendorId: string;
  listingCount: number;
  reviewCount: number;
  followerCount: number;
  saveCount: number;
  openNow: boolean | null;
}

/**
 * VS5.11 — Derived analytics panel. No fake stats: every number comes from the
 * analytics API (computed from real relationship records). openNow is null when
 * hours are unset (honest).
 */
export function VendorAnalyticsPanel() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vendor/analytics")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setData(d.analytics))
      .catch(() => setError("load_failed"));
  }, []);

  if (error) return <p data-testid="analytics-error" style={{ color: "var(--role-danger)" }}>{error}</p>;
  if (!data) return <p data-testid="analytics-loading">Loading analytics…</p>;

  const stats: [string, string | number][] = [
    ["Listings", data.listingCount],
    ["Reviews", data.reviewCount],
    ["Followers", data.followerCount],
    ["Saves", data.saveCount],
  ];

  return (
    <section data-testid="analytics-panel" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)" }}>Insights</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {stats.map(([label, value]) => (
          <div key={label} data-testid={`stat-${label.toLowerCase()}`} style={{ border: "1px solid var(--role-border)", borderRadius: "var(--radius)", padding: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--role-font-display)" }}>{value}</div>
            <div style={{ fontSize: 13, color: "var(--role-text-muted)" }}>{label}</div>
          </div>
        ))}
      </div>
      {data.openNow !== null && (
        <span data-testid="analytics-open-now" style={{ fontSize: 13, color: "var(--role-accent-strong)" }}>
          {data.openNow ? "Currently open" : "Currently closed"}
        </span>
      )}
    </section>
  );
}
