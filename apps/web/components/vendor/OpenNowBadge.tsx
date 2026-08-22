"use client";

import { isOpenNow } from "@voeq/data";
import type { Vendor } from "@voeq/data";

/**
 * VS5.3 — "Open now" badge. Honest: only renders when hours are set AND currently
 * open. If hours are unset, renders nothing (never claims "always open").
 */
export function OpenNowBadge({ vendor }: { vendor: Vendor }) {
  const open = isOpenNow(vendor.hours ?? null);
  if (open === null) return null; // hours unset — show nothing
  return (
    <span
      data-testid="open-now-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 999,
        color: open ? "var(--role-accent-strong)" : "var(--role-text-muted)",
        background: open ? "var(--role-accent-soft)" : "var(--role-surface)",
        border: "1px solid var(--role-border)",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: open ? "var(--role-accent-strong)" : "var(--role-text-muted)" }} />
      {open ? "Open now" : "Closed"}
    </span>
  );
}
