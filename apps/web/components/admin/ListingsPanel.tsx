"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Trash2, Undo2, Search } from "lucide-react";
import type { Capability } from "@voeq/data";

/**
 * Staff batch 1 / task 9 — listing moderation queue.
 * The /api/staff/listings POST existed with zero UI callers; this is the
 * caller. Remove requires a reason (>= 10 chars) because the vendor receives
 * it verbatim in a notification with appeal instructions.
 */

interface ListingRow {
  id: string;
  title: string;
  vendorId: string;
  vendorName: string;
  status: "active" | "removed";
  isPublished: boolean;
  isFeatured: boolean;
  featuredUntil: string | null;
  priceMinMinor: number;
}

export function ListingsPanel({ capabilities }: { capabilities: Capability[] }) {
  const canModerate = capabilities.includes("listing.moderate");
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [confirm, setConfirm] = useState<{ row: ListingRow; action: "remove" | "feature" | "unfeature" } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/listings");
      const data = await res.json();
      if (res.ok && data.ok) setRows(data.listings as ListingRow[]);
      else setError(String(data.error ?? `Failed (${res.status})`));
    } catch {
      setError("Network error loading listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canModerate) void load();
    else setLoading(false);
  }, [canModerate, load]);

  async function applyAction() {
    if (!confirm) return;
    setBusy(true);
    try {
      const res = await fetch("/api/staff/listings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listingId: confirm.row.id, action: confirm.action, reason: reason.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setToast({ kind: "ok", text: `${labelFor(confirm.action)} applied ✓${confirm.action === "remove" ? " — vendor notified" : confirm.action === "feature" ? " — vendor notified" : ""}` });
        setConfirm(null);
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
    return <p style={{ fontSize: 14, color: "var(--role-text-muted)" }}>Your staff role cannot moderate listings.</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--role-text-muted)" }}>
          {loading ? "Loading…" : `${rows.length} listing${rows.length === 1 ? "" : "s"} (newest first, max 100)`}
        </p>
        <button onClick={() => void load()} style={{ background: "none", border: "1px solid var(--role-border)", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "var(--role-text)", cursor: "pointer", display: "flex", gap: 6, alignItems: "center" }}>
          <Search size={13} /> Refresh
        </button>
      </div>

      {error && <p style={{ color: "var(--color-danger, #b91c1c)", fontSize: 13 }}>{error}</p>}
      {toast && (
        <p style={{ fontSize: 13, color: toast.kind === "ok" ? "var(--color-status-open, #1a7f37)" : "var(--color-danger, #b91c1c)" }}>{toast.text}</p>
      )}

      {!loading && !error && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--role-text-muted)", borderBottom: "1px solid var(--role-border)" }}>
                <th style={{ padding: "8px 10px" }}>Listing</th>
                <th style={{ padding: "8px 10px" }}>Vendor</th>
                <th style={{ padding: "8px 10px" }}>Status</th>
                <th style={{ padding: "8px 10px" }}>Featured</th>
                <th style={{ padding: "8px 10px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--role-border)" }}>
                  <td style={{ padding: "10px", fontWeight: 600, color: "var(--role-text)" }}>{r.title}</td>
                  <td style={{ padding: "10px", color: "var(--role-text-muted)" }}>{r.vendorName}</td>
                  <td style={{ padding: "10px" }}>
                    <span style={{ fontWeight: 600, color: r.status === "active" && r.isPublished ? "var(--color-status-open, #1a7f37)" : r.status === "removed" ? "var(--color-danger, #b91c1c)" : "var(--role-text-muted)" }}>
                      {r.status === "removed" ? "removed" : r.isPublished ? "live" : "draft"}
                    </span>
                  </td>
                  <td style={{ padding: "10px" }}>
                    {r.isFeatured ? (
                      <span style={{ color: "var(--role-accent-strong)", fontWeight: 600 }}>
                        ★{r.featuredUntil ? ` until ${new Date(r.featuredUntil).toISOString().slice(0, 10)}` : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ padding: "10px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {r.status === "active" && (
                      <button
                        onClick={() => setConfirm({ row: r, action: "remove" })}
                        title="Remove from platform (soft — reversible, vendor notified)"
                        style={btn("var(--color-danger, #b91c1c)")}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                    {!r.isFeatured ? (
                      <button onClick={() => setConfirm({ row: r, action: "feature" })} title="Feature for 30 days" style={btn("var(--role-accent-strong)")}>
                        <Star size={13} /> Feature
                      </button>
                    ) : (
                      <button onClick={() => setConfirm({ row: r, action: "unfeature" })} style={btn("var(--role-text-muted)")}>
                        <Undo2 size={13} /> Unfeature
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirm && (
        <div
          role="dialog"
          aria-label="Confirm listing action"
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15, 23, 18, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => { setConfirm(null); setReason(""); }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(440px, 94vw)", background: "var(--role-bg, #fff)", borderRadius: 12, padding: 20, border: "1px solid var(--role-border)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, color: "var(--role-text)" }}>
              {labelFor(confirm.action)} “{confirm.row.title}”?
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--role-text-muted)" }}>
              {confirm.action === "remove" && "Soft removal — the listing drops off Explore immediately but stays in the DB for audit/restore. The vendor is notified with your reason and appeal instructions."}
              {confirm.action === "feature" && "Featured on relevant surfaces for 30 days. The vendor is notified."}
              {confirm.action === "unfeature" && "Ends the feature placement early. No notification."}
            </p>
            {(confirm.action === "remove" || confirm.action === "feature") && (
              <label style={{ fontSize: 13, color: "var(--role-text)", display: "block", marginBottom: 12 }}>
                {confirm.action === "remove" ? "Reason (required, min 10 chars — sent verbatim to the vendor)" : "Note (optional)"}
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  style={{ display: "block", marginTop: 4, padding: 8, borderRadius: 8, border: "1px solid var(--role-border)", background: "var(--role-surface)", color: "var(--role-text)", width: "100%", boxSizing: "border-box", fontSize: 13 }}
                />
              </label>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setConfirm(null); setReason(""); }} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--role-border)", background: "transparent", color: "var(--role-text)", fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={() => void applyAction()}
                disabled={busy || (confirm.action === "remove" && reason.trim().length < 10)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: confirm.action === "remove" ? "var(--color-danger, #b91c1c)" : "var(--role-accent-strong)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: busy || (confirm.action === "remove" && reason.trim().length < 10) ? 0.5 : 1 }}
              >
                {busy ? "Applying…" : `Confirm ${labelFor(confirm.action)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function btn(color: string): React.CSSProperties {
  return {
    background: "none",
    border: `1px solid ${color}`,
    color,
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    gap: 5,
    alignItems: "center",
    marginLeft: 6,
  };
}

function labelFor(a: "remove" | "feature" | "unfeature"): string {
  return a === "remove" ? "Remove" : a === "feature" ? "Feature" : "Unfeature";
}
