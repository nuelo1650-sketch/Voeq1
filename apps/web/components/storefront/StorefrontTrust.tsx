"use client";

import { useState } from "react";
import type { VendorStorefrontView } from "@voeq/data";

/**
 * StorefrontTrust — reviews (graceful absence, no fake reviews) + the Follow /
 * Message CTAs. Per founder rule & locked scope: NO auth yet, so the CTAs are
 * present and styled as active buttons but are NO-OP (Phase D adds real behavior).
 * They must NOT be `disabled` — they look live, they just do nothing yet.
 */

export function StorefrontTrust({ vendor }: { vendor: VendorStorefrontView }) {
  const [followed, setFollowed] = useState(false);
  const [messaged, setMessaged] = useState(false);

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

  // No-op handlers: auth is a Phase D concern. Visible intent, no side effects.
  const onFollow = () => {
    setFollowed(true);
    // TODO(Phase D): wire to auth + follow mutation.
    console.warn("[storefront] Follow is a no-op until Phase D auth lands.");
  };
  const onMessage = () => {
    setMessaged(true);
    console.warn("[storefront] Message is a no-op until Phase D auth lands.");
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
          onClick={onFollow}
          style={ctaStyle}
        >
          {followed ? "Following" : "Follow"}
        </button>
        <button
          data-testid="storefront-message-btn"
          onClick={onMessage}
          style={{ ...ctaStyle, background: "transparent", color: "var(--role-accent-strong)" }}
        >
          {messaged ? "Message sent (demo)" : "Message"}
        </button>
      </div>
    </section>
  );
}
