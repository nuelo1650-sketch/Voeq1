"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { ReviewResponse } from "@/lib/apiTypes";

/**
 * ReviewForm — create/update a vendor review (VS4.4).
 * Doc 09 §9.8: one review per (shopper, vendor) — upsert server-side.
 * Auth-gated: unauthed → /login?next=<current path>.
 */
export function ReviewForm({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setMsg(null);
    if (rating < 1) {
      setMsg("Please pick a star rating.");
      return;
    }
    if (body.trim().length < 10) {
      setMsg("Please write at least 10 characters.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, rating, body: body.trim() }),
      });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (res.ok) {
        await res.json() as ReviewResponse;
        setBody("");
        setRating(0);
        setMsg("Thanks — your review was saved.");
        // Refresh so the list shows the new/updated review.
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        setMsg(d.error ?? "Could not save review.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} data-testid="review-form" className="voeq-comment-form">
      <div style={{ display: "flex", gap: 4 }} aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star`}
            aria-pressed={rating >= n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: (hover || rating) >= n ? "var(--color-amber)" : "var(--color-ink-subtle, #d8d2c4)", transition: "color .12s ease" }}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        data-testid="review-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share what you bought and how it went (min 10 characters)"
        rows={3}
        className="voeq-textarea"
      />
      <div className="voeq-comment-actions">
        <button type="submit" disabled={busy} data-testid="review-submit" className="voeq-btn voeq-btn--primary" style={{ padding: "10px 18px", fontSize: 14 }}>
          {busy ? "Saving…" : "Post review"}
        </button>
        {msg && <span data-testid="review-msg" className="voeq-comment-msg">{msg}</span>}
      </div>
    </form>
  );
}
