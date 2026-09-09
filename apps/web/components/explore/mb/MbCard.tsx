"use client";

/**
 * MbCard — the Money Bag grid card (A8): 4:3 image, LIVE/NEW tag, ▹ 1/N
 * counter for multi-image listings (B8), equalized height, hover lift,
 * staggered reveal 100ms. This is a THIN variant of ListingCard for the
 * MB floor rails/grid — it does NOT replace ListingCard (r81 swipe track,
 * matrix-asserted testids stay untouched on existing surfaces).
 *
 * Honesty (B7): NEW tag = real 72h freshness from createdAt; LIVE = featured;
 * no rating stars unless real; no sold counts.
 */

import Link from "next/link";
import type { ExploreListing } from "@voeq/data";
import { cdnTransform } from "@/lib/image-upload";

function naira(minor: number): string {
  return `₦${(minor / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function isFresh(l: ExploreListing): boolean {
  if (!l.createdAt) return false;
  const t = new Date(l.createdAt).getTime();
  return Date.now() - t < 72 * 3600 * 1000;
}

export function MbCard({
  listing: l,
  revealDelay = 0,
  eager = false,
}: {
  listing: ExploreListing;
  revealDelay?: number;
  eager?: boolean;
}) {
  const imgs = (l.images ?? []).filter(Boolean);
  const src = imgs[0] ?? l.image;
  const isNew = isFresh(l) && !l.featured;

  return (
    <Link
      href={`/listing/${l.id}`}
      data-testid="mb-card"
      className="mb-gcard"
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        borderRadius: 16,
        overflow: "hidden",
        background: "var(--role-surface)",
        border: "1px solid var(--role-border)",
        animation: `mbReveal 1.1s cubic-bezier(.2,.6,.2,1) ${revealDelay}ms both`,
      }}
    >
      <div style={{ position: "relative", aspectRatio: "4 / 3", background: "rgba(15,42,29,0.05)" }}>
        {src && (
          <img
            src={cdnTransform(src, 600)}
            alt={l.title}
            loading={eager ? "eager" : "lazy"}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        {l.featured && (
          <span
            data-testid="mb-card-live"
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: "var(--forest-deep, #0F2A1D)",
              color: "var(--color-amber, #E8A33D)",
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: "0.08em",
              borderRadius: 999,
              padding: "4px 9px",
            }}
          >
            ✦ LIVE
          </span>
        )}
        {isNew && (
          <span
            data-testid="mb-card-new"
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: "rgba(255,254,249,0.92)",
              color: "var(--forest-deep, #0F2A1D)",
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: "0.08em",
              borderRadius: 999,
              padding: "4px 9px",
            }}
          >
            NEW
          </span>
        )}
        {imgs.length > 1 && (
          <span
            data-testid="mb-card-imgcount"
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              background: "rgba(15,42,29,0.72)",
              color: "#f6f1e6",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 999,
              padding: "3px 8px",
            }}
          >
            ▹ 1/{imgs.length}
          </span>
        )}
      </div>
      <div style={{ padding: "10px 12px 12px" }}>
        <h4
          style={{
            margin: 0,
            fontSize: 14.5,
            fontWeight: 600,
            color: "var(--role-text)",
            lineHeight: 1.3,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {l.title}
        </h4>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontFamily: "var(--role-font-display)", fontSize: 15, fontWeight: 700, color: "var(--forest-deep, #0F2A1D)" }}>
            {naira(l.priceMinor)}
          </span>
          <span style={{ fontSize: 12, color: "var(--role-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "48%" }}>
            {l.vendorName}
          </span>
        </div>
      </div>
    </Link>
  );
}
