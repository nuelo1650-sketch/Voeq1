"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, MessageSquare, Heart, Bookmark, ArrowUpRight } from "lucide-react";

interface WeeklyData {
  week: {
    views: number;
    messages: number;
    saves: number;
    followers: number;
    reviews: number;
  };
}

/**
 * P-A round 66 — "This week" metrics for the vendor dashboard.
 * REAL DATA from /api/vendor/weekly (page_events + messages + saves + follows).
 * Honest: while loading shows a gentle placeholder (NOT "—" forever); on error
 * shows an explicit "unavailable". Never fabricates.
 */
export function VendorWeeklyStats() {
  const [data, setData] = useState<WeeklyData["week"] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/vendor/weekly")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: WeeklyData) => {
        if (!cancelled) setData(d.week);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p data-testid="weekly-error" style={{ fontSize: 13, color: "var(--role-danger)" }}>
        Weekly stats are temporarily unavailable.
      </p>
    );
  }

  const items: Array<{ icon: React.ReactNode; label: string; value: number }> = [
    { icon: <Eye size={16} />, label: "Storefront views", value: data?.views ?? 0 },
    { icon: <MessageSquare size={16} />, label: "Messages", value: data?.messages ?? 0 },
    { icon: <Bookmark size={16} />, label: "Saves", value: data?.saves ?? 0 },
    { icon: <Heart size={16} />, label: "New followers", value: data?.followers ?? 0 },
  ];

  return (
    <div
      data-testid="vendor-weekly"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12,
      }}
    >
      {items.map((it) => (
        <Link
          key={it.label}
          href="/vendor/analytics"
          data-testid={`weekly-${it.label.toLowerCase().replace(/\s+/g, "-")}`}
          style={{
            background: "var(--role-surface)",
            border: "1px solid var(--role-border)",
            borderRadius: "var(--radius-md)",
            padding: "14px 16px",
            boxShadow: "0 2px 8px rgba(15,42,29,.05)",
            textDecoration: "none",
            color: "inherit",
            display: "block",
          }}
        >
          <div style={{ color: "var(--role-muted)", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            {it.icon}
            {it.label}
            <ArrowUpRight size={12} style={{ marginLeft: "auto", color: "var(--role-gold)" }} />
          </div>
          <div
            style={{
              fontFamily: "var(--role-font-display)",
              fontSize: 28,
              fontWeight: 700,
              color: "var(--role-text)",
              marginTop: 4,
            }}
          >
            {data ? it.value : "…"}
          </div>
        </Link>
      ))}
    </div>
  );
}
