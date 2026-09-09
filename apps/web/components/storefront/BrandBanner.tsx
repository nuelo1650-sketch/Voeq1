"use client";

/**
 * BrandBanner (Money Bag A17 — Option C HYBRID, D2a).
 *
 * The storefront banner slot with TWO states:
 *  - DEFAULT (photoCover null): system-generated brand plate — flat
 *    forest-deep field, QUIET small-caps name (a watermark, v1.7), ONE thin
 *    amber rule, letter-spaced category line in muted cream. Composed 100%
 *    from real data; every storefront looks finished from second one.
 *  - UPLOAD (photoCover set): the same slot swaps to the vendor's cover
 *    image (already moderated via the signed-Cloudinary pipeline). The
 *    identity card below stays the name hero in both states.
 *
 * Typography law (v1.7): the banner name NEVER competes with the identity
 * card — it is a quiet echo, not a headline. The name appears ONCE as a hero.
 */

import { cdnTransform } from "@/lib/image-upload";

export function BrandBanner({
  vendorName,
  categoryNames,
  photoCover,
  campusLine,
}: {
  vendorName: string;
  categoryNames: string[];
  photoCover?: string | null;
  campusLine?: string | null;
}) {
  const catLine = categoryNames.slice(0, 3).join(" · ");

  // UPLOAD state: the vendor's own cover fills the slot.
  if (photoCover) {
    return (
      <div
        data-testid="brand-banner"
        data-banner-state="photo"
        style={{
          position: "relative",
          height: "clamp(120px, 22vw, 190px)",
          overflow: "hidden",
          background: "var(--forest-deep, #0B211A)",
        }}
      >
        <img
          src={cdnTransform(photoCover, 1200)}
          alt={`${vendorName} storefront cover`}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* bottom scrim so the identity card overlap reads on any photo */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, transparent 55%, rgba(11,33,26,0.55) 100%)",
          }}
        />
      </div>
    );
  }

  // DEFAULT state: the system-generated brand plate (v1.5-final aesthetic).
  return (
    <div
      data-testid="brand-banner"
      data-banner-state="brand"
      style={{
        position: "relative",
        height: "clamp(120px, 22vw, 190px)",
        background: "var(--forest-deep, #0B211A)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        overflow: "hidden",
      }}
    >
      {/* quiet small-caps watermark name (v1.7) */}
      <span
        style={{
          fontFamily: "var(--role-font-display)",
          fontWeight: 600,
          fontSize: "clamp(13px, 2.6vw, 17px)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(246,241,230,0.82)",
          textAlign: "center",
          maxWidth: "90%",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {vendorName}
      </span>
      {/* ONE thin amber rule (30px) */}
      <span
        aria-hidden
        style={{ width: 30, height: 1.5, background: "var(--color-amber, #E8A33D)", borderRadius: 2, flexShrink: 0 }}
      />
      {/* letter-spaced category line */}
      {catLine && (
        <span
          style={{
            fontSize: "clamp(9px, 1.8vw, 11px)",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(246,241,230,0.45)",
            textAlign: "center",
            padding: "0 16px",
          }}
        >
          {catLine}
          {campusLine ? <span style={{ opacity: 0.7 }}> — {campusLine}</span> : null}
        </span>
      )}
    </div>
  );
}
