"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Vendor } from "@voeq/data";

/**
 * VS5.3 — Contact socials editor. Phone + Instagram + Twitter/X + TikTok.
 * WhatsApp is intentionally absent (Doc 13 §13.13 BANNED).
 */
export function StorefrontSocialsForm({ vendor, disabled = false, onChange }: {
  vendor: Vendor;
  disabled?: boolean;
  onChange?: (draft: Partial<Vendor>) => void;
}) {
  const router = useRouter();
  const s = vendor.socials ?? {};
  const [phone, setPhone] = useState(s.phone ?? "");
  const [instagram, setInstagram] = useState(s.instagram ?? "");
  const [twitter, setTwitter] = useState(s.twitter ?? "");
  const [tiktok, setTiktok] = useState(s.tiktok ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (disabled) return;
    setStatus("saving");
    setError(null);
    const res = await fetch("/api/vendor/socials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, instagram, twitter, tiktok }),
    });
    if (res.ok) {
      setStatus("saved");
      onChange?.({ socials: { phone: phone || undefined, instagram: instagram || undefined, twitter: twitter || undefined, tiktok: tiktok || undefined } });
      router.refresh();
    } else {
      const e = await res.json().catch(() => ({}));
      setError(e.error ?? "save_failed");
      setStatus("error");
    }
  }

  return (
    <section data-testid="socials-form" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)", margin: 0 }}>Contact & socials</h3>
      {(["phone", "instagram", "twitter", "tiktok"] as const).map((key) => {
        const val = key === "phone" ? phone : key === "instagram" ? instagram : key === "twitter" ? twitter : tiktok;
        const set = key === "phone" ? setPhone : key === "instagram" ? setInstagram : key === "twitter" ? setTwitter : setTiktok;
        const label = key === "phone" ? "Phone" : key === "instagram" ? "Instagram" : key === "twitter" ? "Twitter / X" : "TikTok";
        return (
          <label key={key} style={{ fontSize: 14, color: "var(--role-text-muted)", display: "flex", flexDirection: "column", gap: 4 }}>
            {label}
            <input
              data-testid={`socials-${key}`}
              value={val}
              disabled={disabled}
              onChange={(e) => set(e.target.value)}
              placeholder={key === "phone" ? "+234…" : `@handle`}
              style={inputStyle}
            />
          </label>
        );
      })}
      <button data-testid="socials-save" onClick={save} disabled={disabled || status === "saving"} className="auth-submit" style={{ opacity: disabled ? 0.5 : 1 }}>
        {status === "saving" ? "Saving…" : "Save socials"}
      </button>
      {status === "saved" && <span data-testid="socials-saved" style={{ fontSize: 13, color: "var(--role-accent-strong)" }}>Saved.</span>}
      {status === "error" && <span data-testid="socials-error" style={{ fontSize: 13, color: "var(--role-danger)" }}>{error}</span>}
    </section>
  );
}

const inputStyle: React.CSSProperties = { fontFamily: "var(--role-font-ui)", fontSize: 14, padding: 8, borderRadius: "var(--radius)", border: "1px solid var(--role-border)", background: "var(--role-surface)", color: "var(--role-text)" };
