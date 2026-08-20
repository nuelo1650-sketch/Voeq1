"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadListing, type ExploreListing } from "@voeq/data";
import { ContourEdge, CampusFingerprint } from "@voeq/contour";

/**
 * ListingDetail — PG-PUB-005 (Doc 04). The editorial object (Doc 05 B.15.3 Editorial /
 * C.6). Imagery leads (B.6 framed 4:3; contour monogram fallback for missing/ugly photos),
 * title in display type, price/availability as PROMINENT data (never buried), trust row,
 * vendor, and a NATIVE message CTA (Doc 01/03 LOCKED: native, NOT WhatsApp).
 *
 * Continuity (Doc 05 D.4.1): the whole detail opens with the `.explore-entrance` directional
 * move (same token as Explore) and carries a contour-whisper at top, so opening from an
 * Explore card reads as one world. Full shared-element image morph is a Slice-7-era nicety;
 * this is the continuity-carrying entrance per the approved workaround.
 */

const AVAIL_LABEL: Record<string, string> = { open: "Open now", closed: "Sold out", soon: "Opening soon" };

function formatPrice(minor: number): string {
  // Currency: NGN (₦) per product decisions §7 (NGN-only; no multi-currency in Phase 1).
  return `₦ ${(minor / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

type DetailStatus = "loading" | "success" | "error" | "notfound";

export function ListingDetail({ id }: { id: string }) {
  const [status, setStatus] = useState<DetailStatus>("loading");
  const [listing, setListing] = useState<ExploreListing | null>(null);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgState, setMsgState] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    loadListing(id)
      .then((res) => {
        if (cancelled) return;
        if (!res) setStatus("notfound");
        else {
          setListing(res);
          setStatus("success");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === "loading") {
    return (
      <div data-testid="listing-detail-loading" style={{ padding: "var(--space-8) var(--nav-inline-pad)", color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}>
        Loading…
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div data-testid="listing-detail-notfound" style={{ padding: "var(--space-8) var(--nav-inline-pad)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <h1 style={{ fontFamily: "var(--role-font-display)", fontSize: "28px", margin: 0, color: "var(--role-text)" }}>Listing not found</h1>
        <Link href="/explore" data-testid="listing-detail-back" style={{ color: "var(--role-accent)", fontFamily: "var(--role-font-ui)" }}>← Back to Explore</Link>
      </div>
    );
  }

  if (status === "error" || !listing) {
    return (
      <div data-testid="listing-detail-error" role="alert" style={{ padding: "var(--space-8) var(--nav-inline-pad)", color: "var(--role-danger)", fontFamily: "var(--role-font-ui)" }}>
        Couldn’t load this listing.
      </div>
    );
  }

  const img = listing.image;
  return (
    <div
      data-testid="listing-detail"
      className="explore-entrance"
      style={{ minHeight: "100vh", padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)" }}
    >
      {/* Continuity: contour whisper carries from Explore (D.4.1 component 1/2 spirit). */}
      <div data-testid="listing-detail-contour" style={{ marginBottom: "var(--space-2)" }}>
        <ContourEdge intensity="whisper" />
      </div>

      <div style={{ marginBottom: "var(--space-2)" }}>
        <Link
          href="/explore"
          data-testid="listing-detail-back"
          style={{ color: "var(--role-text-muted)", textDecoration: "none", fontFamily: "var(--role-font-ui)", fontSize: "14px" }}
        >
          ← Explore
        </Link>
      </div>

      <div
        className="listing-detail-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", alignItems: "start" }}
      >
        {/* Gallery: imagery LEADS (B.6 framed; monogram fallback for missing/ugly). */}
        <div data-testid="listing-detail-gallery" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <div
            data-testid="listing-detail-image-frame"
            style={{
              position: "relative",
              aspectRatio: "4 / 3",
              background: "var(--role-surface-sunken)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {img ? (
              <img
                src={img}
                alt={listing.title}
                data-testid="listing-detail-image"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <CampusFingerprint
                data-testid="listing-detail-monogram"
                activity={[0.6, 0.3, 0.8]}
                style={{ width: 72, height: 72 }}
              />
            )}
          </div>
        </div>

        {/* Meta: title (display) + price/availability as data + trust + vendor + native CTA. */}
        <div data-testid="listing-detail-meta" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <h1
            data-testid="listing-detail-title"
            style={{
              fontFamily: "var(--role-font-display)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: 1.05,
              margin: 0,
              color: "var(--role-text)",
            }}
          >
            {listing.title}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <span
              data-testid="listing-detail-price"
              style={{
                fontFamily: "var(--role-font-mono)",
                fontVariantNumeric: "tabular-nums",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--role-text)",
              }}
            >
              {formatPrice(listing.priceMinor)}
            </span>
            {listing.availability && (
              <span
                data-testid="listing-detail-availability"
                style={{ fontSize: "12px", padding: "4px 10px", border: "1px solid var(--role-border)", borderRadius: 999, color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}
              >
                {AVAIL_LABEL[listing.availability]}
              </span>
            )}
          </div>

          <div
            data-testid="listing-detail-trust"
            style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", fontSize: "13px", color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)" }}
          >
            {listing.verified && (
              <span data-testid="listing-detail-verified" style={{ color: "var(--role-accent-strong)" }}>
                ✓ Student Vouched
              </span>
            )}
            {typeof listing.rating === "number" && (
              <span data-testid="listing-detail-rating">★ {listing.rating.toFixed(1)}</span>
            )}
            {listing.featured && (
              <span data-testid="listing-detail-featured" style={{ color: "var(--role-gold)" }}>
                Featured
              </span>
            )}
          </div>

          <div data-testid="listing-detail-vendor" style={{ fontFamily: "var(--role-font-ui)", fontSize: "14px", color: "var(--role-text)" }}>
            by {listing.vendorName}
          </div>

          {/* Native message CTA (Doc 01/03 LOCKED: native, NOT WhatsApp). Composer is a Slice-7
              surface; here we prove the CTA + native send (pending->sent cause-effect, D.3). */}
          <div data-testid="listing-detail-message" style={{ marginTop: "var(--space-2)" }}>
            {!msgOpen ? (
              <button data-testid="listing-detail-message-cta" onClick={() => setMsgOpen(true)} style={ctaStyle}>
                Message {listing.vendorName}
              </button>
            ) : (
              <div
                data-testid="listing-detail-composer"
                style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", border: "1px solid var(--role-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-2)" }}
              >
                <textarea
                  data-testid="listing-detail-input"
                  placeholder={`Message ${listing.vendorName}…`}
                  rows={3}
                  style={{
                    fontFamily: "var(--role-font-ui)",
                    fontSize: "14px",
                    border: "1px solid var(--role-border)",
                    borderRadius: "var(--radius)",
                    padding: "8px",
                    resize: "vertical",
                    color: "var(--role-text)",
                    background: "var(--role-surface)",
                  }}
                />
                <div style={{ display: "flex", gap: "var(--space-1)", alignItems: "center" }}>
                  <button
                    data-testid="listing-detail-send"
                    disabled={msgState === "sending"}
                    onClick={() => {
                      setMsgState("sending");
                      // Native send simulation: pending -> sent (cause-effect, D.3).
                      setTimeout(() => setMsgState("sent"), 400);
                    }}
                    style={ctaStyle}
                  >
                    {msgState === "sending" ? "Sending…" : "Send"}
                  </button>
                  {msgState === "sent" && (
                    <span data-testid="listing-detail-status" style={{ fontSize: "13px", color: "var(--role-accent-strong)", fontFamily: "var(--role-font-ui)" }}>
                      Sent (native — not WhatsApp)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ctaStyle: React.CSSProperties = {
  fontFamily: "var(--role-font-ui)",
  fontSize: "16px",
  fontWeight: 600,
  padding: "14px 28px",
  borderRadius: "var(--radius)",
  border: "1px solid var(--role-accent-strong)",
  background: "var(--role-accent-strong)",
  color: "var(--role-on-accent)",
  cursor: "pointer",
};
