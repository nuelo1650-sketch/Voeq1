"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { categories } from "@voeq/data";
import { ListingCreateForm } from "@/components/vendor/ListingCreateForm";

interface ListingRow {
  id: string;
  title: string;
  priceMinMinor: number;
  priceMaxMinor: number | null;
  categoryId: string;
  description: string | null;
  images: string[];
}

/**
 * VS5.6/7/8 — Listing manager: create, inline-edit, and remove listings.
 * Ownership is also enforced server-side (api/listings/[id]); this UI just wires
 * the calls. Remove is behind a confirm step (no silent deletion).
 */
export function ListingManager({ initial }: { initial: ListingRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section data-testid="listings-section">
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)" }}>Listings</h2>
      {initial.length === 0 ? (
        <p style={{ color: "var(--role-muted)" }}>No listings yet — create your first one.</p>
      ) : (
        <ul data-testid="listing-list" style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {initial.map((l) => (
            <li key={l.id} data-testid="listing-item">
              {editingId === l.id ? (
                <ListingEditForm listing={l} onDone={() => { setEditingId(null); router.refresh(); }} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span>{l.title} — ₦{Math.round(l.priceMinMinor / 100)}</span>
                  <span style={{ display: "flex", gap: 6 }}>
                    <button data-testid={`listing-edit-${l.id}`} onClick={() => setEditingId(l.id)} className="auth-submit" style={smallBtn}>Edit</button>
                    <ListingRemoveButton id={l.id} onDone={() => router.refresh()} />
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <ListingCreateForm />
    </section>
  );
}

function ListingEditForm({ listing, onDone }: { listing: ListingRow; onDone: () => void }) {
  const [title, setTitle] = useState(listing.title);
  const [categoryId, setCategoryId] = useState(listing.categoryId);
  const [priceMinMinor, setPriceMinMinor] = useState(String(Math.round(listing.priceMinMinor / 100)));
  const [priceMaxMinor, setPriceMaxMinor] = useState(listing.priceMaxMinor ? String(Math.round(listing.priceMaxMinor / 100)) : "");
  const [description, setDescription] = useState(listing.description ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setStatus("saving");
    setError(null);
    const res = await fetch(`/api/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        categoryId,
        priceMinMinor: Math.round(Number(priceMinMinor) * 100),
        priceMaxMinor: priceMaxMinor ? Math.round(Number(priceMaxMinor) * 100) : null,
        description: description || null,
      }),
    });
    if (res.ok) onDone();
    else {
      const e = await res.json().catch(() => ({}));
      setError(e.error ?? "save_failed");
      setStatus("error");
    }
  }

  return (
    <div data-testid={`listing-edit-form-${listing.id}`} style={{ display: "flex", flexDirection: "column", gap: 6, border: "1px solid var(--role-border)", borderRadius: "var(--radius)", padding: 8 }}>
      <input data-testid="listing-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
      <select data-testid="listing-edit-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputStyle}>
        {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
      </select>
      <div style={{ display: "flex", gap: 8 }}>
        <input data-testid="listing-edit-price-min" value={priceMinMinor} onChange={(e) => setPriceMinMinor(e.target.value)} style={inputStyle} />
        <input data-testid="listing-edit-price-max" value={priceMaxMinor} onChange={(e) => setPriceMaxMinor(e.target.value)} style={inputStyle} />
      </div>
      <textarea data-testid="listing-edit-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      <div style={{ display: "flex", gap: 6 }}>
        <button data-testid="listing-edit-save" onClick={save} disabled={status === "saving"} className="auth-submit">Save</button>
        <button data-testid="listing-edit-cancel" onClick={onDone} className="auth-submit" style={{ ...smallBtn, background: "var(--role-surface)" }}>Cancel</button>
      </div>
      {status === "error" && <span data-testid="listing-edit-error" style={{ fontSize: 13, color: "var(--role-danger)" }}>{error}</span>}
    </div>
  );
}

function ListingRemoveButton({ id, onDone }: { id: string; onDone: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) onDone();
    else {
      const e = await res.json().catch(() => ({}));
      setError(e.error ?? "delete_failed");
      setConfirming(false);
    }
  }

  if (!confirming) {
    return <button data-testid={`listing-remove-${id}`} onClick={() => setConfirming(true)} className="auth-submit" style={{ ...smallBtn, color: "var(--role-danger)" }}>Remove</button>;
  }
  return (
    <span style={{ display: "flex", gap: 6 }} data-testid={`listing-confirm-${id}`}>
      <button data-testid={`listing-confirm-yes-${id}`} onClick={remove} disabled={busy} className="auth-submit" style={{ ...smallBtn, color: "var(--role-danger)" }}>{busy ? "…" : "Confirm"}</button>
      <button data-testid={`listing-confirm-no-${id}`} onClick={() => setConfirming(false)} className="auth-submit" style={{ ...smallBtn, background: "var(--role-surface)" }}>Cancel</button>
      {error && <span style={{ fontSize: 12, color: "var(--role-danger)" }}>{error}</span>}
    </span>
  );
}

const inputStyle: React.CSSProperties = { fontFamily: "var(--role-font-ui)", fontSize: 14, padding: 8, borderRadius: "var(--radius)", border: "1px solid var(--role-border)", background: "var(--role-surface)", color: "var(--role-text)" };
const smallBtn: React.CSSProperties = { fontFamily: "var(--role-font-ui)", fontSize: 13, fontWeight: 600, padding: "4px 10px", borderRadius: "var(--radius)", border: "1px solid var(--role-border)", background: "var(--role-accent-strong)", color: "#fff", cursor: "pointer" };
