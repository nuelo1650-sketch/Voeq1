"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Vendor } from "@voeq/data";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<(typeof DAYS)[number], string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

/**
 * VS5.3 — Operating hours editor. Stores Vendor.hours. "Open now" badge reflects it.
 */
export function StorefrontHoursForm({ vendor, disabled = false, onChange }: {
  vendor: Vendor;
  disabled?: boolean;
  onChange?: (draft: Partial<Vendor>) => void;
}) {
  const router = useRouter();
  const h = vendor.hours;
  const [open, setOpen] = useState(h?.open ?? "09:00");
  const [close, setClose] = useState(h?.close ?? "18:00");
  const [days, setDays] = useState<string[]>([...(h?.days ?? [])]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function toggleDay(d: string) {
    const next = days.includes(d) ? days.filter((x) => x !== d) : [...days, d];
    setDays(next);
    onChange?.({ hours: { open, close, days: next as never } });
  }

  async function save() {
    if (disabled) return;
    setStatus("saving");
    setError(null);
    const res = await fetch("/api/vendor/hours", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open, close, days }),
    });
    if (res.ok) {
      setStatus("saved");
      onChange?.({ hours: { open, close, days: days as never } });
      router.refresh();
    } else {
      const e = await res.json().catch(() => ({}));
      setError(e.error ?? "save_failed");
      setStatus("error");
    }
  }

  return (
    <section data-testid="hours-form" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)", margin: 0 }}>Opening hours</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <label style={labelStyle}>Open<input data-testid="hours-open" type="time" value={open} disabled={disabled} onChange={(e) => { setOpen(e.target.value); onChange?.({ hours: { open: e.target.value, close, days: days as never } }); }} style={inputStyle} /></label>
        <label style={labelStyle}>Close<input data-testid="hours-close" type="time" value={close} disabled={disabled} onChange={(e) => { setClose(e.target.value); onChange?.({ hours: { open, close: e.target.value, days: days as never } }); }} style={inputStyle} /></label>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {DAYS.map((d) => (
          <button
            key={d}
            data-testid={`hours-day-${d}`}
            type="button"
            onClick={() => toggleDay(d)}
            disabled={disabled}
            className="auth-submit"
            style={{
              ...dayBtn,
              background: days.includes(d) ? "var(--role-accent-strong)" : "var(--role-surface)",
              color: days.includes(d) ? "#fff" : "var(--role-text-muted)",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {DAY_LABELS[d]}
          </button>
        ))}
      </div>
      <button data-testid="hours-save" onClick={save} disabled={disabled || status === "saving"} className="auth-submit" style={{ opacity: disabled ? 0.5 : 1 }}>
        {status === "saving" ? "Saving…" : "Save hours"}
      </button>
      {status === "saved" && <span data-testid="hours-saved" style={{ fontSize: 13, color: "var(--role-accent-strong)" }}>Saved.</span>}
      {status === "error" && <span data-testid="hours-error" style={{ fontSize: 13, color: "var(--role-danger)" }}>{error}</span>}
    </section>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 14, color: "var(--role-text-muted)", display: "flex", flexDirection: "column", gap: 4 };
const inputStyle: React.CSSProperties = { fontFamily: "var(--role-font-ui)", fontSize: 14, padding: 8, borderRadius: "var(--radius)", border: "1px solid var(--role-border)", background: "var(--role-surface)", color: "var(--role-text)" };
const dayBtn: React.CSSProperties = { fontFamily: "var(--role-font-ui)", fontSize: 13, fontWeight: 600, padding: "6px 10px", borderRadius: "var(--radius)", border: "1px solid var(--role-border)", cursor: "pointer" };
