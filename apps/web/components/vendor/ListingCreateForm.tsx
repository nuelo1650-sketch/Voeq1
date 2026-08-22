"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { categories } from "@voeq/data";

/**
 * VS5.6 — Create listing form (inline, no modal). Owner-only (server enforces).
 * On success, refreshes the dashboard so the new listing appears in the list/preview.
 */
export function ListingCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [priceMinMinor, setPriceMinMinor] = useState("");
  const [priceMaxMinor, setPriceMaxMinor] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setStatus("saving");
    setError(null);
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        categoryId,
        priceMinMinor: Math.round(Number(priceMinMinor) * 100),
        priceMaxMinor: priceMaxMinor ? Math.round(Number(priceMaxMinor) * 100) : null,
        description: description || null,
      }),
    });
    if (res.ok) {
      setStatus("saved");
      setTitle("");
      setPriceMinMinor("");
      setPriceMaxMinor("");
      setDescription("");
      router.refresh();
    } else {
      const e = await res.json().catch(() => ({}));
      setError(e.error ?? "save_failed");
      setStatus("error");
    }
  }

  return (
    <section data-testid="listing-create-form" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)", margin: 0 }}>Add a listing</h3>
      <input data-testid="listing-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (min 3 chars)" style={inputStyle} />
      <select data-testid="listing-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputStyle}>
        {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
      </select>
      <div style={{ display: "flex", gap: 8 }}>
        <input data-testid="listing-price-min" value={priceMinMinor} onChange={(e) => setPriceMinMinor(e.target.value)} placeholder="Min price (₦)" inputMode="numeric" style={inputStyle} />
        <input data-testid="listing-price-max" value={priceMaxMinor} onChange={(e) => setPriceMaxMinor(e.target.value)} placeholder="Max (optional)" inputMode="numeric" style={inputStyle} />
      </div>
      <textarea data-testid="listing-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      <button data-testid="listing-create" onClick={save} disabled={status === "saving"} className="auth-submit">
        {status === "saving" ? "Creating…" : "Create listing"}
      </button>
      {status === "saved" && <span data-testid="listing-created" style={{ fontSize: 13, color: "var(--role-accent-strong)" }}>Created.</span>}
      {status === "error" && <span data-testid="listing-create-error" style={{ fontSize: 13, color: "var(--role-danger)" }}>{error}</span>}
    </section>
  );
}

const inputStyle: React.CSSProperties = { fontFamily: "var(--role-font-ui)", fontSize: 14, padding: 8, borderRadius: "var(--radius)", border: "1px solid var(--role-border)", background: "var(--role-surface)", color: "var(--role-text)" };
