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
    <form onSubmit={submit} data-testid="review-form" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
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
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: (hover || rating) >= n ? "var(--color-amber)" : "var(--role-border)" }}
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
        style={{ width: "100%", fontFamily: "var(--role-font-ui)", fontSize: 14, padding: 10, borderRadius: "var(--radius)", border: "1px solid var(--role-border)", background: "var(--role-surface)", color: "var(--role-text)", resize: "vertical" }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <button type="submit" disabled={busy} data-testid="review-submit" style={{ fontFamily: "var(--role-font-ui)", fontWeight: 600, fontSize: 14, padding: "10px 18px", borderRadius: "var(--radius)", border: "none", background: "var(--role-accent-strong)", color: "var(--role-on-accent)", cursor: busy ? "default" : "pointer" }}>
          {busy ? "Saving…" : "Post review"}
        </button>
        {msg && <span data-testid="review-msg" style={{ fontSize: 13, color: "var(--role-text-muted)" }}>{msg}</span>}
      </div>
    </form>
  );
}
