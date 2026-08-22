"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { loadListing, type ExploreListing } from "@voeq/data";
import { ContourEdge, CampusFingerprint } from "@voeq/contour";
import { SaveButton } from "@/components/shopper/SaveButton";
import { CommentForm } from "@/components/shopper/CommentForm";
import { CommentsList, type DisplayComment } from "@/components/shopper/CommentsList";
import { ReportForm } from "@/components/shopper/ReportForm";

/**
 * ListingDetail — PG-PUB-005 (Doc 04). The editorial object (Doc 05 B.15.3 Editorial /
 * C.6). Imagery leads (B.6 framed 4:3; contour monogram fallback for missing/ugly photos),
 * title in display type, price/availability as PROMINENT data (never buried), trust row,
 * vendor, a NATIVE message CTA (Doc 01/03 LOCKED: native, NOT WhatsApp), plus Share / Report
 * surfaces and a mobile sticky action bar.
 *
 * Auth is deferred to VS2 (Reversal 4): the message CTA is gated behind an honest inline
 * "Get Started" panel (no fake send, no disabled-looking dead button, no "Coming soon").
 */

const AVAIL_LABEL: Record<string, string> = { open: "Open now", closed: "Sold out", soon: "Opening soon" };

function formatPrice(minor: number): string {
  // Currency: NGN (₦) per product decisions §7 (NGN-only; no multi-currency in Phase 1).
  return `₦ ${(minor / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

type DetailStatus = "loading" | "success" | "error" | "notfound";

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
  textAlign: "center",
};

export function ListingDetail({ id }: { id: string }) {
  const [status, setStatus] = useState<DetailStatus>("loading");
  const [listing, setListing] = useState<ExploreListing | null>(null);
  const pathname = usePathname();

  // Share
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  // Report
  const [reportOpen, setReportOpen] = useState(false);
  // Message — gated (auth deferred to VS2)
  const [msgGated, setMsgGated] = useState(false);
  // Comments (VS4.5) — public-read; fetched on mount
  const [comments, setComments] = useState<DisplayComment[]>([]);

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
    // Fetch public comments independently (flat, newest-first).
    fetch(`/api/listings/${id}/comments`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setComments(d.comments); })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: listing?.title ?? "Voeq listing", url });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 2000);
      }
    } catch {
      /* user cancelled share sheet — ignore */
    }
  };

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
      style={{ minHeight: "100vh", padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)", paddingBottom: "calc(var(--space-8) + env(safe-area-inset-bottom))" }}
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

          {/* Secondary actions (desktop) */}
          <div className="listing-detail-actions" style={{ display: "flex", gap: "var(--space-2)" }}>
            <button data-testid="listing-detail-share" onClick={handleShare} style={{ ...ctaStyle, background: "transparent", color: "var(--role-accent-strong)", padding: "10px 18px", fontSize: "14px", flex: 1 }}>
              {shareState === "copied" ? "Link copied" : "Share"}
            </button>
            <SaveButton targetType="listing" targetId={listing.id} className="listing-detail-save" />
            <button
              data-testid="listing-detail-report"
              onClick={() => setReportOpen((o) => !o)}
              style={{ background: "transparent", border: "1px solid var(--role-border)", color: "var(--role-text-muted)", borderRadius: "var(--radius)", padding: "10px 18px", fontSize: "14px", fontFamily: "var(--role-font-ui)", cursor: "pointer" }}
            >
              {reportOpen ? "Close" : "Report"}
            </button>
          </div>

          {reportOpen && (
            <div
              data-testid="listing-detail-report-panel"
              style={{ border: "1px solid var(--role-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-2)", fontFamily: "var(--role-font-ui)" }}
            >
              <strong style={{ color: "var(--role-text)" }}>Report this listing</strong>
              <ReportForm targetType="listing" targetId={listing.id} onDone={() => setReportOpen(false)} />
            </div>
          )}
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

          {/* Message CTA — gated (auth deferred to VS2, Reversal 4). Honest inline panel,
              no fake send. */}
          <div data-testid="listing-detail-message" style={{ marginTop: "var(--space-2)" }}>
            {!msgGated ? (
              <button data-testid="listing-detail-message-cta" onClick={() => setMsgGated(true)} style={ctaStyle}>
                Message {listing.vendorName}
              </button>
            ) : (
              <div
                data-testid="listing-detail-auth-gate"
                role="status"
                style={{
                  border: "1px solid var(--role-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--space-3)",
                  background: "var(--role-surface)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                  fontFamily: "var(--role-font-ui)",
                  fontSize: "14px",
                  color: "var(--role-text-muted)",
                }}
              >
                <span data-testid="listing-detail-auth-gate-text">
                  Sign in to message {listing.vendorName} directly.
                </span>
                <Link
                  href={`/login?next=${encodeURIComponent(pathname)}`}
                  data-testid="listing-detail-auth-gate-cta"
                  style={{ alignSelf: "flex-start", fontWeight: 600, fontSize: "14px", padding: "10px 18px", borderRadius: "var(--radius)", background: "var(--role-accent-strong)", color: "var(--color-forest, #1f4d33)", textDecoration: "none" }}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Comments — flat, public-read (VS4.5). Form is auth-gated. */}
        <section data-testid="listing-detail-comments" style={{ marginTop: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <CommentsList comments={comments} />
          <CommentForm listingId={listing.id} />
        </section>

      </div>

      {/* Mobile sticky action bar (CSS-only visibility via .listing-detail-sticky). */}
      <div data-testid="listing-detail-sticky" className="listing-detail-sticky" style={{ display: "none" }}>
        <button data-testid="listing-detail-sticky-message" onClick={() => setMsgGated(true)} style={{ ...ctaStyle, flex: 1 }}>
          Message
        </button>
        <button data-testid="listing-detail-sticky-share" onClick={handleShare} style={{ ...ctaStyle, background: "transparent", color: "var(--role-accent-strong)", flex: "0 0 auto" }}>
          {shareState === "copied" ? "Copied" : "Share"}
        </button>
      </div>
    </div>
  );
}
