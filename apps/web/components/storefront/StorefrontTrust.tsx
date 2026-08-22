"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { VendorStorefrontView } from "@voeq/data";
import { FollowButton } from "@/components/shopper/FollowButton";
import { ReviewForm } from "@/components/shopper/ReviewForm";
import { ReviewsList } from "@/components/shopper/ReviewsList";
import { ReportForm } from "@/components/shopper/ReportForm";

/**
 * StorefrontTrust — reviews (real, public-read) + Follow / Message CTAs.
 * Reviews + Follow are LIVE (VS4.3/4.4). Message (VS6): an authed shopper
 * creates the conversation and is routed to the thread; unauthed shoppers see
 * the /login?next=<current> gate (Doc 03 §3.9 auth-to-act pattern).
 */

export function StorefrontTrust({ vendor }: { vendor: VendorStorefrontView }) {
  const pathname = usePathname();
  const router = useRouter();
  const [gated, setGated] = useState<null | "review" | "message" | "report">(null);
  const [msgBusy, setMsgBusy] = useState(false);

  async function startConversation() {
    setMsgBusy(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: vendor.id }),
      });
      if (res.status === 401) {
        setGated("message"); // unauth -> show login gate
        return;
      }
      const data = await res.json();
      if (data.conversation?.id) {
        router.push(`/messages/${data.conversation.id}`);
      }
    } finally {
      setMsgBusy(false);
    }
  }

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

      <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
        <FollowButton vendorId={vendor.id} className="storefront-follow-btn" />
        <button
          data-testid="storefront-message-btn"
          onClick={startConversation}
          disabled={msgBusy}
          style={{ ...ctaStyle, background: "transparent", color: "var(--role-accent-strong)" }}
        >
          Message
        </button>
        <button
          data-testid="storefront-report-btn"
          onClick={() => setGated("report")}
          style={{ background: "transparent", border: "1px solid var(--role-border)", color: "var(--role-text-muted)", borderRadius: "var(--radius)", padding: "12px 18px", fontSize: "14px", fontFamily: "var(--role-font-ui)", cursor: "pointer" }}
        >
          Report
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
          {gated === "report" ? (
            <ReportForm targetType="vendor" targetId={vendor.id} onDone={() => setGated(null)} />
          ) : (
            <>
              <span data-testid="storefront-auth-gate-text">
                {gated === "message"
                  ? `Sign in to message ${vendor.name} directly.`
                  : `Sign in to follow ${vendor.name} and get updates on new listings.`}
              </span>
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
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
            </>
          )}
        </div>
      )}
    </section>
  );
}
