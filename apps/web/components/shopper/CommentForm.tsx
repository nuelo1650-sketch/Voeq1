"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { CreateResponse } from "@/lib/apiTypes";

/**
 * CommentForm — flat comment on a listing (VS4.5).
 * Public-read: anyone sees comments. Auth-to-act: posting requires login,
 * redirecting to /login?next=<current path> (Doc 03 §3.9).
 */
export function CommentForm({ listingId }: { listingId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setMsg(null);
    if (body.trim().length < 2) {
      setMsg("Comment must be at least 2 characters.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (res.ok) {
        const _data = await res.json() as CreateResponse;
        setBody("");
        setMsg("Comment posted.");
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        setMsg(d.error ?? "Could not post comment.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} data-testid="comment-form" className="voeq-comment-form">
      <textarea
        data-testid="comment-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a comment…"
        rows={3}
        className="voeq-textarea"
      />
      <div className="voeq-comment-actions">
        <button type="submit" disabled={busy} data-testid="comment-submit" className="voeq-btn voeq-btn--primary" style={{ padding: "10px 18px", fontSize: 14 }}>
          {busy ? "Posting…" : "Post comment"}
        </button>
        {msg && <span data-testid="comment-msg" className="voeq-comment-msg">{msg}</span>}
      </div>
    </form>
  );
}
