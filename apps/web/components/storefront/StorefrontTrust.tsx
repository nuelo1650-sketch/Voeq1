"use client";

import { useState } from "react";
import Link from "next/link";
import type { VendorStorefrontView } from "@voeq/data";

/**
 * StorefrontTrust — reviews (graceful absence, no fake reviews) + Follow /
 * Message CTAs. Auth is deferred to VS2 (Reversal 4), so these are NOT dead
 * no-ops: clicking reveals an honest inline auth-gate that links to Get Started
 * (/explore) — no "Coming soon", no disabled buttons (which would look broken).
 */

export function StorefrontTrust({ vendor }: { vendor: VendorStorefrontView }) {
  const [gated, setGated] = useState<null | "follow" | "message">(null);

  const ctaStyle: React.CSSProperties = {
    fontFamily: "var(--role-font-ui)",
    fontSize: "15px",
    fontWeight: 600,
    padding: "12px 24px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--role-accent-strong)",
    background: "var(--role-accent-strong)",
    color: "var(--role-on-accent)",
    cursor: "pointer",
  };

  return (
    <section
      data-testid="storefront-trust"
      aria-label="Reviews and contact"
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
    >
      <h2 data-testid="storefront-reviews-heading" style={{ fontFamily: "var(--role-font-display)", fontSize: "1.5rem", margin: 0, color: "var(--role-text)" }}>
        Reviews
      </h2>

      {/* Honest graceful absence — never render a fake review. */}
      {vendor.reviews.length === 0 ? (
        <p data-testid="storefront-reviews-empty" style={{ color: "var(--role-text-muted)", fontFamily: "var(--role-font-ui)", margin: 0 }}>
          No reviews yet. Be the first to share your experience.
        </p>
      ) : (
        <ul data-testid="storefront-reviews-list" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {vendor.reviews.map((r) => (
            <li key={r.id} data-testid="storefront-review" style={{ border: "1px solid var(--role-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-2)" }}>
              <span style={{ color: "var(--role-gold)" }}>★ {r.rating.toFixed(1)}</span>
              <p style={{ fontFamily: "var(--role-font-ui)", color: "var(--role-text)", margin: "4px 0 0" }}>{r.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
        <button
          data-testid="storefront-follow-btn"
          onClick={() => setGated("follow")}
          style={ctaStyle}
        >
          Follow
        </button>
        <button
          data-testid="storefront-message-btn"
          onClick={() => setGated("message")}
          style={{ ...ctaStyle, background: "transparent", color: "var(--role-accent-strong)" }}
        >
          Message
        </button>
      </div>

      {gated && (
        <div
          data-testid="storefront-auth-gate"
          role="status"
          style={{
            marginTop: "var(--space-2)",
            padding: "var(--space-3)",
            border: "1px solid var(--role-border)",
            borderRadius: "var(--radius-lg)",
            background: "var(--role-surface)",
            fontFamily: "var(--role-font-ui)",
            fontSize: "14px",
            color: "var(--role-text-muted)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          <span data-testid="storefront-auth-gate-text">
            {gated === "follow"
              ? `Sign in to follow ${vendor.name} and get updates on new listings.`
              : `Sign in to message ${vendor.name} directly.`}
          </span>
          <Link
            href="/explore"
            data-testid="storefront-auth-gate-cta"
            style={{
              alignSelf: "flex-start",
              fontFamily: "var(--role-font-ui)",
              fontWeight: 600,
              fontSize: "14px",
              padding: "10px 18px",
              borderRadius: "var(--radius)",
              background: "var(--role-accent-strong)",
              color: "var(--role-on-accent)",
              textDecoration: "none",
            }}
          >
            Get Started
          </Link>
        </div>
      )}
    </section>
  );
}
