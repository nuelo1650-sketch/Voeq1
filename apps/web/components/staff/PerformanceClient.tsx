"use client";

import { useState } from "react";
import type { VendorStat } from "@/app/staff/performance/page";

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min`;
  return `${(mins / 60).toFixed(1)} h`;
}

function colorFor(ms: number | null): { bg: string; fg: string } {
  if (ms == null) return { bg: "#F5F3EF", fg: "#6B6B6B" };
  const hrs = ms / 3600000;
  if (hrs <= 1) return { bg: "#D1FAE5", fg: "#065F46" };
  if (hrs <= 4) return { bg: "#FEF3C7", fg: "#92400E" };
  return { bg: "#FEE2E2", fg: "#991B1B" };
}

export function PerformanceClient({ initialStats }: { initialStats: VendorStat[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const sorted = [...initialStats].sort((a, b) => (b.avgMs ?? -1) - (a.avgMs ?? -1));
  const visible = sorted.filter((s) =>
    !searchTerm.trim() || s.vendorName.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", padding: "var(--space-4)" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--color-forest)", margin: "0 0 4px" }}>Vendor Performance</h1>
        <p style={{ fontSize: 14, color: "var(--color-ink-muted)", margin: "0 0 20px" }}>Response time tracking — real buyer-vendor conversations.</p>
        <input
          type="text"
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: "8px 14px", fontSize: 14, border: "1px solid var(--color-ink-subtle)", borderRadius: 8, marginBottom: "var(--space-3)", width: "100%", maxWidth: 400 }}
        />
        <div style={{ background: "#fff", border: "1px solid var(--color-ink-subtle)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "var(--color-cream)", borderBottom: "1px solid var(--color-ink-subtle)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-ink-muted)" }}>Vendor</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-ink-muted)" }}>Avg response</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-ink-muted)" }}>Conversations</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-ink-muted)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => {
                const c = colorFor(s.avgMs);
                return (
                  <tr key={s.vendorId} style={{ borderBottom: "1px solid var(--color-ink-subtle)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--color-forest)" }}>{s.vendorName}</td>
                    <td style={{ padding: "12px 16px", color: "var(--color-ink-muted)" }}>{formatDuration(s.avgMs)}</td>
                    <td style={{ padding: "12px 16px", color: "var(--color-ink-muted)" }}>{s.conversations}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 999, background: c.bg, color: c.fg, fontSize: 12, fontWeight: 600 }}>
                        {s.avgMs == null ? "—" : s.avgMs / 3600000 <= 1 ? "fast" : s.avgMs / 3600000 <= 4 ? "medium" : "slow"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
