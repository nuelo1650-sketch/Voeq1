"use client";

/**
 * ContextStrip (Money Bag A11) — the campus context bar for the MB explore floor.
 *
 * 📍 campus · live count · Campus/Areas/All-Nigeria segmented switch · Filters
 * button with active-count badge. Sticky under the topbar. Data comes from the
 * sections payload — the strip NEVER invents a number (B7).
 *
 * Campus state machine (B6): first visit shows the "Set your campus" chip and
 * All-Nigeria scope; a stored voeq:preferred-campus makes Campus the active
 * scope; the switch is scope memory, not identity — logout keeps the device
 * memory (campus is context, never identity).
 */

import { MapPin, SlidersHorizontal } from "lucide-react";

export type ExploreScope = "campus" | "areas" | "all";

export function ContextStrip({
  campusName,
  liveCount,
  scope,
  onScopeChange,
  activeFilterCount,
  onOpenFilters,
}: {
  campusName: string;
  liveCount: number;
  scope: ExploreScope;
  onScopeChange: (s: ExploreScope) => void;
  activeFilterCount: number;
  onOpenFilters: () => void;
}) {
  const scopeLabel =
    scope === "campus" ? campusName : scope === "areas" ? "Near campus" : "All Nigeria";

  const segBtn = (s: ExploreScope, label: string) => (
    <button
      data-testid={`mb-scope-${s}`}
      onClick={() => onScopeChange(s)}
      aria-pressed={scope === s}
      style={{
        border: "none",
        cursor: "pointer",
        padding: "6px 14px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        transition: "background .25s ease, color .25s ease",
        background: scope === s ? "var(--forest-deep, #0F2A1D)" : "transparent",
        color: scope === s ? "#f6f1e6" : "var(--role-muted)",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      data-testid="mb-context-strip"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "var(--role-surface, #fffef9)",
        borderBottom: "1px solid var(--role-border)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px var(--nav-inline-pad, 16px)",
          maxWidth: 1200,
          margin: "0 auto",
          flexWrap: "wrap",
        }}
      >
        <span
          data-testid="mb-ctx-location"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--role-text)",
            minWidth: 0,
          }}
        >
          <MapPin size={15} style={{ color: "var(--color-amber, #E8A33D)", flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {scopeLabel}
          </span>
        </span>

        {liveCount > 0 && (
          <span
            data-testid="mb-ctx-count"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--forest-deep, #0F2A1D)",
              background: "rgba(15,42,29,0.07)",
              borderRadius: 999,
              padding: "3px 9px",
              whiteSpace: "nowrap",
            }}
          >
            <span
              aria-hidden
              className="mb-live-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: "var(--color-amber, #E8A33D)",
                display: "inline-block",
              }}
            />
            {liveCount} live
          </span>
        )}

        <span style={{ flex: 1 }} />

        <div
          role="group"
          aria-label="Market scope"
          style={{
            display: "inline-flex",
            gap: 2,
            background: "rgba(30,59,47,0.06)",
            borderRadius: 999,
            padding: 2,
          }}
        >
          {segBtn("campus", "Campus")}
          {segBtn("areas", "Areas")}
          {segBtn("all", "All Nigeria")}
        </div>

        <button
          data-testid="mb-filters-open"
          onClick={onOpenFilters}
          aria-label={`Filters${activeFilterCount ? ` (${activeFilterCount} active)` : ""}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: "1px solid var(--role-border)",
            background: "var(--role-surface)",
            color: "var(--role-text)",
            borderRadius: 999,
            padding: "6px 13px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            position: "relative",
          }}
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span
              data-testid="mb-filters-count"
              style={{
                position: "absolute",
                top: -5,
                right: -5,
                minWidth: 17,
                height: 17,
                borderRadius: 999,
                background: "var(--color-amber, #E8A33D)",
                color: "#fff",
                fontSize: 10.5,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
