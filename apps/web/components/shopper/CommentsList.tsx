"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Comment } from "@voeq/data";
import { formatDateFixed } from "@/lib/formatDateFixed";

/** Enriched comment as returned by GET /api/listings/[id]/comments (authorName resolved). */
export type DisplayComment = Omit<Comment, "listingId" | "authorId" | "status"> & { authorName?: string; isMine?: boolean };

/** COMMENTS LAYOUT (2026-09-05, approved direction): initial window + load-more
 *  reveal instead of a wall of every comment; warm cards below. */
const COMMENTS_WINDOW = 5;

/**
 * CommentsList — public-read, flat (no threading), newest first (VS4.5).
 * Honest empty state. Author display name resolved server-side (no raw identityId).
 * P-A round 22 (FEATURE): authors can now EDIT and DELETE their own comments
 * (isMine flag from the API; PATCH/DELETE on /api/listings/[id]/comments/[cid]).
 */
export function CommentsList({ comments, listingId }: { comments: DisplayComment[]; listingId?: string }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [visibleCount, setVisibleCount] = useState(COMMENTS_WINDOW);

  async function saveEdit(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/listings/${listingId ?? "__missing__"}/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft.trim() }),
      });
      if (res.ok) {
        setEditingId(null);
        localStorage.setItem("voeq:comments-bump", String(Date.now()));
        router.refresh();
      } else {
        alert("Could not save your edit. Try again.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function removeComment(id: string) {
    if (!confirm("Delete this comment?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/listings/${listingId ?? "__missing__"}/comments/${id}`, { method: "DELETE" });
      if (res.ok) {
        localStorage.setItem("voeq:comments-bump", String(Date.now()));
        router.refresh();
      } else {
        alert("Could not delete. Try again.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-testid="comments-list">
      <h3 style={{ fontFamily: "var(--role-font-display)", fontSize: "1.3rem", margin: "0 0 var(--space-2)" }}>
        Comments {comments.length > 0 && <span style={{ color: "var(--role-text-muted)", fontSize: 14 }}>({comments.length})</span>}
      </h3>
      {comments.length === 0 ? (
        <p data-testid="comments-empty" className="voeq-comment-msg">
          No comments yet.
        </p>
      ) : (
        <>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {comments.slice(0, visibleCount).map((c) => (
            <li key={c.id} data-testid="comment-item" className="voeq-comment">
              <div className="voeq-comment-avatar" aria-hidden>
                {(c.authorName ?? "S").slice(0, 1).toUpperCase()}
              </div>
              <div className="voeq-comment-body">
                <div className="voeq-comment-head">
                  <span className="voeq-comment-author">{c.authorName ?? "Shopper"}</span>
                  {c.isMine && (
                    <span
                      data-testid="comment-author-chip"
                      style={{
                        fontSize: 10.5,
                        fontWeight: 650,
                        letterSpacing: 0.4,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(232,163,61,.16)",
                        color: "var(--color-amber)",
                        textTransform: "uppercase",
                      }}
                    >
                      You
                    </span>
                  )}
                  <span className="voeq-comment-time">{formatDateFixed(c.createdAt)}</span>
                  {c.isMine && editingId !== c.id && (
                    <span className="voeq-comment-actions" style={{ marginLeft: 12, display: "inline-flex", gap: 8 }}>
                      <button
                        data-testid="comment-edit"
                        onClick={() => { setEditingId(c.id); setDraft(c.body); }}
                        style={{ background: "none", border: "none", color: "var(--color-forest)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0 }}
                      >
                        Edit
                      </button>
                      <button
                        data-testid="comment-delete"
                        onClick={() => removeComment(c.id)}
                        disabled={busy}
                        style={{ background: "none", border: "none", color: "var(--role-danger, #B3261E)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0 }}
                      >
                        Delete
                      </button>
                    </span>
                  )}
                </div>
                {editingId === c.id ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                    <textarea
                      data-testid="comment-edit-input"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={2}
                      style={{
                        fontFamily: "var(--role-font-ui)", fontSize: 14, padding: "8px 10px",
                        borderRadius: 10, border: "1px solid var(--role-border)",
                        background: "#fff", color: "var(--role-text)", resize: "vertical",
                      }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        data-testid="comment-edit-save"
                        onClick={() => saveEdit(c.id)}
                        disabled={busy || !draft.trim()}
                        style={{ background: "var(--color-forest)", color: "#f6f1e6", border: "none", borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 650, cursor: "pointer" }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{ background: "transparent", color: "var(--color-forest)", border: "1px solid var(--role-border)", borderRadius: 999, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="voeq-comment-text">{c.body}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
        {comments.length > visibleCount && (
          <button
            type="button"
            data-testid="comments-load-more"
            onClick={() => setVisibleCount((v) => v + COMMENTS_WINDOW)}
            style={{
              marginTop: 4,
              alignSelf: "flex-start",
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid var(--role-border)",
              background: "var(--role-surface)",
              color: "var(--role-accent-strong)",
              fontFamily: "var(--role-font-ui)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Show more comments ({comments.length - visibleCount} remaining)
          </button>
        )}
        </>
      )}
    </div>
  );
}
