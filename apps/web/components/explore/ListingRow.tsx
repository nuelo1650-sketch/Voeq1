"use client";

import { useState } from "react";
import Link from "next/link";
import type { ExploreListing } from "@voeq/data";
import { CampusFingerprint } from "@voeq/contour";
import { BadgeCheck } from "lucide-react";

/**
 * ListingRow — PassA-2 list-view variant of the explore grid card.
 * Image (left, 96x72) + title + vendor (with Verified badge if present) +
 * price + rating. Full row is a link to /listing/[id] (no separate action
 * button — the clickable row is the affordance). No availability text (that
 * belongs on the detail page). Bookmark omitted to keep the row plain.
 */
function formatPrice(minor: number): string {
  return `₦ ${(minor / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export function ListingRow({
  listing,
  onNavigate,
}: {
  listing: ExploreListing;
  onNavigate?: (id: string) => void;
}) {
  // BUG-C (2026-09-06): row thumbnail is now a mini swipe track — every
  // listing surface shows ALL photos, not just the first.
  const imgs = Array.isArray(listing.images) && listing.images.length > 0
    ? listing.images
    : listing.image ? [listing.image] : [];
  const [idx, setIdx] = useState(0);
  return (
    <Link
      href={`/listing/${listing.id}`}
      data-testid="explore-list-row"
      onClick={() => onNavigate?.(listing.id)}
      style={{
        display: "flex",
        gap: "var(--space-3)",
        alignItems: "center",
        padding: "var(--space-2)",
        border: "1px solid var(--role-border)",
        borderRadius: "var(--radius-lg)",
        background: "var(--role-surface)",
        textDecoration: "none",
        color: "inherit",
        transition: "transform 160ms ease, box-shadow 160ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "var(--shadow-2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: 96,
          height: 72,
          flexShrink: 0,
          borderRadius: 8,
          overflow: "hidden",
          background: "var(--role-surface-sunken)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {imgs.length > 0 ? (
          <>
            <div
              data-testid="explore-row-track"
              className="voeq-card-track"
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.clientWidth === 0) return;
                const i = Math.max(0, Math.min(imgs.length - 1, Math.round(el.scrollLeft / el.clientWidth)));
                setIdx((prev) => (prev === i ? prev : i));
              }}
              style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", width: "100%", height: "100%", scrollbarWidth: "none" }}
            >
              {imgs.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`${listing.title} — photo ${i + 1}`}
                  loading="lazy"
                  style={{ minWidth: "100%", width: "100%", height: "100%", objectFit: "cover", display: "block", scrollSnapAlign: "start" }}
                />
              ))}
            </div>
            {imgs.length > 1 && (
              <div style={{ position: "absolute", bottom: 4, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4, pointerEvents: "none" }}>
                {imgs.map((_, i) => (
                  <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i === idx ? "var(--color-cream)" : "rgba(246,241,230,.45)" }} />
                ))}
              </div>
            )}
          </>
        ) : (
          <CampusFingerprint activity={[0.6, 0.3, 0.8]} style={{ width: 40, height: 40 }} />
        )}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--role-text)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {listing.title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--role-text-muted)",
            minWidth: 0,
          }}
        >
          <span
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {listing.vendorName}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--role-text)" }}>
            {formatPrice(listing.priceMinor)}
          </span>
          {typeof listing.vendorRatingAvg === "number" && (listing.vendorRatingCount ?? 0) > 0 ? (
            <span style={{ color: "var(--role-text-muted)" }}>
              ★ {listing.vendorRatingAvg.toFixed(1)} ({listing.vendorRatingCount})
            </span>
          ) : (
            <span style={{ color: "var(--role-text-muted)", fontSize: 12 }}>New</span>
          )}
        </div>
      </div>
    </Link>
  );
}
