"use client";

import { useState } from "react";
import type { VendorStorefrontView } from "@voeq/data";
import { LikeButton } from "@/components/shopper/LikeButton";
import { ReviewForm } from "@/components/shopper/ReviewForm";
import { ReviewsList } from "@/components/shopper/ReviewsList";
import { ReportForm } from "@/components/shopper/ReportForm";

/**
 * StorefrontTrust — S1 "Goods first" (2026-09-06): reviews block + quiet
 * Like/Report. Follow moved to the hero CTA row; the duplicate Message button
 * is GONE (the hero's Contact is the single conversation entry point — one
 * place per action). Auth-to-act for reviews/report unchanged.
 */

export function StorefrontTrust({ vendor }: { vendor: VendorStorefrontView }) {
  const [gated, setGated] = useState<null | "review" | "report">(null);

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

  const rated = vendor.reviews.filter((r) => typeof r.rating === "number");
  const ratingAvg = rated.length > 0 ? rated.reduce((s, r) => s + (r.rating as number), 0) / rated.length : null;

  return (
    <section
      data-testid="storefront-trust"
      aria-label="Reviews and contact"
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
    >
      <ReviewsList reviews={vendor.reviews} ratingAvg={ratingAvg} ratingCount={rated.length} />

      {/* Auth-to-act: unauthed shoppers see the form behind a /login?next= gate. */}
      {gated === "review" ? (
        <ReviewForm vendorId={vendor.id} />
      ) : (
        <button
          data-testid="storefront-write-review"
          onClick={() => setGated("review")}
          style={{ ...ctaStyle, background: "transparent", color: "var(--role-accent-strong)", alignSelf: "flex-start" }}
        >
          {vendor.reviews.length > 0 ? "Write a review" : "Be the first to review"}
        </button>
      )}

      <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)", flexWrap: "wrap" }}>
        {/* S1: Follow moved to the hero CTA row; Message removed (the hero's
            Contact is the single conversation entry point). Like + Report stay
            here as quiet secondary actions. */}
        <LikeButton targetType="vendor" targetId={vendor.id} className="storefront-like-btn" />
        <button
          data-testid="storefront-report-btn"
          onClick={() => setGated("report")}
          style={{ background: "transparent", border: "1px solid var(--role-border)", color: "var(--role-text-muted)", borderRadius: 999, padding: "11px 18px", fontSize: "13px", fontFamily: "var(--role-font-ui)", cursor: "pointer" }}
        >
          Report
        </button>
      </div>

      {/* S1: the gate is report-only now — the review form renders inline above
          and FollowButton self-gates its own auth redirect. The old
          message/follow gate text was dead code (gated could never be "follow",
          and "message" left with the duplicate Message button). */}
      {gated === "report" && (
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
          <ReportForm targetType="vendor" targetId={vendor.id} onDone={() => setGated(null)} />
        </div>
      )}
    </section>
  );
}
