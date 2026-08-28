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
    <form onSubmit={submit} data-testid="comment-form" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
      <textarea
        data-testid="comment-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a comment…"
        rows={3}
        style={{ width: "100%", fontFamily: "var(--role-font-ui)", fontSize: 14, padding: 10, borderRadius: "var(--radius)", border: "1px solid var(--role-border)", background: "var(--role-surface)", color: "var(--role-text)", resize: "vertical" }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <button type="submit" disabled={busy} data-testid="comment-submit" style={{ fontFamily: "var(--role-font-ui)", fontWeight: 600, fontSize: 14, padding: "10px 18px", borderRadius: "var(--radius)", border: "none", background: "var(--role-accent-strong)", color: "var(--role-on-accent)", cursor: busy ? "default" : "pointer" }}>
          {busy ? "Posting…" : "Post comment"}
        </button>
        {msg && <span data-testid="comment-msg" style={{ fontSize: 13, color: "var(--role-text-muted)" }}>{msg}</span>}
      </div>
    </form>
  );
}
