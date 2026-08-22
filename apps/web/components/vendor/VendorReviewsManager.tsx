"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ReviewView {
  id: string;
  authorId: string;
  rating: number;
  body: string;
  createdAt: string;
  response?: { body: string; createdAt: string; editedAt: string | null } | null;
}

const HOUR = 60 * 60 * 1000;

/**
 * VS5.9/10 — Vendor's own reviews + respond. Fetches via GET /api/vendor/reviews.
 * Response box is disabled once a response exists OR the 24h window (from review
 * createdAt) has elapsed (founder 2026-08-22, Option C simplified to review time).
 * Server re-validates the window regardless.
 */
export function VendorReviewsManager() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/vendor/reviews");
    if (!res.ok) {
      setError("load_failed");
      return;
    }
    const data = await res.json();
    setReviews(data.reviews ?? []);
  }

  useEffect(() => { load(); }, []);

  if (error) return <p data-testid="reviews-error" style={{ color: "var(--role-danger)" }}>{error}</p>;
  if (reviews === null) return <p data-testid="reviews-loading">Loading reviews…</p>;
  if (reviews.length === 0) return <p data-testid="reviews-empty" style={{ color: "var(--role-muted)" }}>No reviews yet.</p>;

  return (
    <section data-testid="vendor-reviews" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)" }}>Reviews</h2>
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} onResponded={load} />
      ))}
    </section>
  );
}

function ReviewCard({ review, onResponded }: { review: ReviewView; onResponded: () => void }) {
  const [text, setText] = useState(review.response?.body ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "locked">("idle");
  const [err, setErr] = useState<string | null>(null);

  const ageMs = Date.now() - new Date(review.createdAt).getTime();
  const windowOpen = ageMs <= 24 * HOUR;
  const hasResponse = !!review.response;
  const locked = hasResponse || !windowOpen;

  async function send() {
    setStatus("saving");
    setErr(null);
    const res = await fetch(`/api/vendor/reviews/${review.id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      setStatus("idle");
      onResponded();
    } else if (data.locked) {
      setStatus("locked");
      onResponded();
    } else {
      setErr(data.error ?? "failed");
      setStatus("error");
    }
  }

  return (
    <div data-testid={`review-${review.id}`} style={{ border: "1px solid var(--role-border)", borderRadius: "var(--radius)", padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
        <span>★ {review.rating}/5</span>
        <span style={{ color: "var(--role-text-muted)" }}>{new Date(review.createdAt).toLocaleDateString()}</span>
      </div>
      <p style={{ margin: 0 }}>{review.body}</p>

      {hasResponse && (
        <div data-testid={`review-response-${review.id}`} style={{ background: "var(--role-surface)", borderRadius: "var(--radius)", padding: 8, fontSize: 14 }}>
          <strong>You replied:</strong> {review.response!.body}
          <div style={{ fontSize: 12, color: "var(--role-text-muted)" }}>
            {new Date(review.response!.createdAt).toLocaleString()}
            {review.response!.editedAt && " (edited)"}
          </div>
        </div>
      )}

      {!hasResponse && (
        <>
          <textarea
            data-testid={`review-response-input-${review.id}`}
            value={text}
            disabled={locked}
            onChange={(e) => setText(e.target.value)}
            placeholder={windowOpen ? "Write a response…" : "24h response window has closed."}
            rows={2}
            style={{ fontFamily: "var(--role-font-ui)", fontSize: 14, padding: 8, borderRadius: "var(--radius)", border: "1px solid var(--role-border)", background: "var(--role-surface)", color: "var(--role-text)" }}
          />
          <button
            data-testid={`review-respond-${review.id}`}
            onClick={send}
            disabled={locked || status === "saving" || text.trim().length === 0}
            className="auth-submit"
          >
            {status === "saving" ? "Sending…" : hasResponse ? "Responded" : "Respond"}
          </button>
          {status === "error" && <span data-testid={`review-error-${review.id}`} style={{ fontSize: 13, color: "var(--role-danger)" }}>{err}</span>}
        </>
      )}
      {!windowOpen && !hasResponse && (
        <span data-testid={`review-locked-${review.id}`} style={{ fontSize: 13, color: "var(--role-text-muted)" }}>Response window closed (24h).</span>
      )}
    </div>
  );
}
