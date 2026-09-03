"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import type { Capability } from "@voeq/data";

/**
 * Staff batch 2 / task 4 — comment moderation queue UI.
 * Caller for /api/staff/content (GET comments) and /api/staff/comments (POST
 * hide/show). Hide requires a reason >= 10 chars because the author receives
 * it verbatim in a notification with appeal instructions (same integrity rule
 * as the review queue and the enforcement ladder).
 */

interface CommentRow {
  id: string;
  listingId: string;
  authorId: string;
  authorName: string;
  body: string;
  status: string;
  createdAt: string;
}

export function CommentsPanel({ capabilities }: { capabilities: Capability[] }) {
  const canModerate = capabilities.includes("review.moderate");
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [confirmHide, setConfirmHide] = useState<CommentRow | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/content");
      const data = await res.json();
      if (res.ok && data.ok) setRows((data.comments as CommentRow[]) ?? []);
      else setError(String(data.error ?? `Failed (${res.status})`));
    } catch {
      setError("Network error loading comments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canModerate) void load();
    else setLoading(false);
  }, [canModerate, load]);

  async function apply(action: "hide" | "show", row: CommentRow, why: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/staff/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ commentId: row.id, action, reason: why }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setToast({ kind: "ok", text: action === "hide" ? "Comment hidden ✓ — author notified" : "Comment restored ✓" });
        setConfirmHide(null);
        setReason("");
        void load();
      } else {
        setToast({ kind: "err", text: String(data.error ?? `Failed (${res.status})`) });
      }
    } catch {
      setToast({ kind: "err", text: "Network error — action not applied." });
    } finally {
      setBusy(false);
    }
  }

  if (!canModerate) {
    return <p style={{ fontSize: 14, color: "var(--role-text-muted)" }}>Your staff role cannot moderate comments.</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--role-text-muted)" }}>
          {loading ? "Loading…" : `${rows.length} comment${rows.length === 1 ? "" : "s"} (newest first, max 100 — hidden ones stay here so you can restore them)`}
        </p>
        <button onClick={() => void load()} style={{ background: "none", border: "1px solid var(--role-border)", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "var(--role-text)", cursor: "pointer", display: "flex", gap: 6, alignItems: "center" }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {error && <p style={{ color: "var(--color-danger, #b91c1c)", fontSize: 13 }}>{error}</p>}
      {toast && (
        <p style={{ fontSize: 13, color: toast.kind === "ok" ? "var(--color-status-open, #1a7f37)" : "var(--color-danger, #b91c1c)" }}>{toast.text}</p>
      )}

      {!loading && !error && rows.length === 0 && (
        <p style={{ color: "var(--role-text-muted)", fontSize: 14 }}>No comments yet.</p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((row) => (
            <div
              key={row.id}
              data-testid={`comment-row-${row.id.slice(0, 8)}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                padding: 12, borderRadius: 8, border: "1px solid var(--role-border)",
                background: row.status === "hidden" ? "color-mix(in srgb, var(--role-danger) 6%, var(--role-surface))" : "var(--role-surface)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--role-text)" }}>
                  {row.authorName}
                  <span style={{ color: "var(--role-text-muted)", fontWeight: 400 }}> · listing {row.listingId.slice(0, 8)}</span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--role-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.body || "(empty)"}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 999, fontWeight: 700,
                  color: row.status === "hidden" ? "var(--role-danger)" : "var(--role-accent)",
                  background: row.status === "hidden" ? "color-mix(in srgb, var(--role-danger) 10%, transparent)" : "color-mix(in srgb, var(--role-accent) 10%, transparent)",
                }}>
                  {row.status === "hidden" ? "HIDDEN" : "PUBLISHED"}
                </span>
                {row.status === "hidden" ? (
                  <button
                    data-testid={`comment-restore-${row.id.slice(0, 8)}`}
                    disabled={busy}
                    onClick={() => void apply("show", row, "")}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      fontSize: 12, fontWeight: 600, fontFamily: "var(--role-font-ui)",
                      padding: "6px 12px", borderRadius: 999, cursor: "pointer",
                      background: "color-mix(in srgb, var(--role-accent) 10%, transparent)",
                      color: "var(--role-accent)",
                      border: "1px solid color-mix(in srgb, var(--role-accent) 30%, transparent)",
                    }}
                  >
                    <Eye size={14} /> Restore
                  </button>
                ) : (
                  <button
                    data-testid={`comment-hide-${row.id.slice(0, 8)}`}
                    disabled={busy}
                    onClick={() => { setConfirmHide(row); setReason(""); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      fontSize: 12, fontWeight: 600, fontFamily: "var(--role-font-ui)",
                      padding: "6px 12px", borderRadius: 999, cursor: "pointer",
                      background: "color-mix(in srgb, var(--role-danger) 8%, transparent)",
                      color: "var(--role-danger)",
                      border: "1px solid color-mix(in srgb, var(--role-danger) 30%, transparent)",
                    }}
                  >
                    <EyeOff size={14} /> Hide
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmHide && (
        <div
          role="dialog"
          aria-label="Hide comment"
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15, 23, 18, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => { setConfirmHide(null); setReason(""); }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(440px, 94vw)", background: "var(--role-bg, #fff)", borderRadius: 12, padding: 20, border: "1px solid var(--role-border)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, color: "var(--role-text)" }}>Hide this comment?</h3>
            <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--role-text-muted)", fontStyle: "italic" }}>
              “{confirmHide.body.slice(0, 160)}{confirmHide.body.length > 160 ? "…" : ""}” — {confirmHide.authorName}
            </p>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--role-text-muted)" }}>
              The comment disappears from the listing immediately. The author is notified with your reason and appeal instructions. Reversible at any time.
            </p>
            <label style={{ fontSize: 13, color: "var(--role-text)", display: "block", marginBottom: 12 }}>
              Reason (required, min 10 chars — sent verbatim to the author)
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                style={{ display: "block", marginTop: 4, padding: 8, borderRadius: 8, border: "1px solid var(--role-border)", background: "var(--role-surface)", color: "var(--role-text)", width: "100%", boxSizing: "border-box", fontSize: 13 }}
              />
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setConfirmHide(null); setReason(""); }} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--role-border)", background: "transparent", color: "var(--role-text)", fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
              <button
                data-testid="comment-hide-confirm"
                onClick={() => void apply("hide", confirmHide, reason.trim())}
                disabled={busy || reason.trim().length < 10}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--color-danger, #b91c1c)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: busy || reason.trim().length < 10 ? 0.5 : 1 }}
              >
                {busy ? "Applying…" : "Confirm hide"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
