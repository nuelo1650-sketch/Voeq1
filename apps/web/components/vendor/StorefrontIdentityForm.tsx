"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// BUNDLE FIX (2026-09-05): barrel import — root ships drizzle+neon to browser.
import { categories } from "@voeq/data/client";
import type { Vendor } from "@voeq/data";

/**
 * VS5.2 — Inline storefront identity edit (name, description, primary category, sub-area).
 * No modal. Saves via PATCH /api/vendor/identity. Bubbles draft state up via onChange
 * so the live preview (VS5.4) can reflect edits immediately.
 */
export function StorefrontIdentityForm({
  vendor,
  disabled = false,
  onChange,
}: {
  vendor: Vendor;
  disabled?: boolean;
  onChange?: (draft: Partial<Vendor>) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(vendor.name);
  const [description, setDescription] = useState(vendor.description);
  const [primaryCategoryId, setPrimaryCategoryId] = useState(vendor.categoryIds[0] ?? "");
  const [subArea, setSubArea] = useState(vendor.subArea ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function emitDraft() {
    onChange?.({
      name,
      description,
      categoryIds: primaryCategoryId ? [primaryCategoryId] : vendor.categoryIds,
      subArea: subArea.trim().length > 0 ? subArea.trim() : null,
    });
  }

  async function save() {
    if (disabled) return;
    setStatus("saving");
    setError(null);
    const res = await fetch("/api/vendor/identity", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, primaryCategoryId, subArea }),
    });
    if (res.ok) {
      setStatus("saved");
      emitDraft();
      router.refresh();
    } else {
      const e = await res.json().catch(() => ({}));
      setError(e.error ?? "save_failed");
      setStatus("error");
    }
  }

  return (
    <section data-testid="identity-form" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)", margin: 0 }}>Business identity</h3>

      <label style={{ fontSize: 14, color: "var(--role-text-muted)" }}>Name</label>
      <input
        data-testid="identity-name"
        value={name}
        disabled={disabled}
        onChange={(e) => { setName(e.target.value); emitDraft(); }}
        style={inputStyle}
      />

      <label style={{ fontSize: 14, color: "var(--role-text-muted)" }}>Description (min 50 chars)</label>
      <textarea
        data-testid="identity-description"
        value={description}
        disabled={disabled}
        rows={3}
        onChange={(e) => { setDescription(e.target.value); emitDraft(); }}
        style={{ ...inputStyle, fontFamily: "var(--role-font-ui)", resize: "vertical" }}
      />
      {description.trim().length > 0 && description.trim().length < 50 && (
        <span data-testid="identity-desc-warn" style={{ fontSize: 12, color: "var(--role-danger)" }}>Minimum 50 characters.</span>
      )}

      <label style={{ fontSize: 14, color: "var(--role-text-muted)" }}>Primary category</label>
      <select
        data-testid="identity-category"
        value={primaryCategoryId}
        disabled={disabled}
        onChange={(e) => { setPrimaryCategoryId(e.target.value); emitDraft(); }}
        style={inputStyle}
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <label style={{ fontSize: 14, color: "var(--role-text-muted)" }}>Sub-area (hostel / faculty, optional)</label>
      <input
        data-testid="identity-subarea"
        value={subArea}
        disabled={disabled}
        onChange={(e) => { setSubArea(e.target.value); emitDraft(); }}
        style={inputStyle}
      />

      <button
        data-testid="identity-save"
        onClick={save}
        disabled={disabled || status === "saving"}
        className="auth-submit"
        style={{ display: "inline-block", marginTop: "var(--space-1)", opacity: disabled ? 0.5 : 1 }}
      >
        {status === "saving" ? "Saving…" : "Save identity"}
      </button>
      {status === "saved" && <span data-testid="identity-saved" style={{ fontSize: 13, color: "var(--role-accent-strong)" }}>Saved.</span>}
      {status === "error" && <span data-testid="identity-error" style={{ fontSize: 13, color: "var(--role-danger)" }}>{error}</span>}
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--role-font-ui)",
  fontSize: 14,
  padding: 8,
  borderRadius: "var(--radius)",
  border: "1px solid var(--role-border)",
  background: "var(--role-surface)",
  color: "var(--role-text)",
};
