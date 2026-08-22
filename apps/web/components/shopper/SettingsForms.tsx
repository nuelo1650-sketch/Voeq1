"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const NOTIF_TYPES = [
  { key: "new_message", label: "New messages" },
  { key: "new_review", label: "New reviews on your vendor" },
  { key: "review_response", label: "Review responses" },
  { key: "new_follower", label: "New followers" },
  { key: "system", label: "System announcements" },
];

/**
 * SettingsForms — VS4.11. Editable notification prefs + campus switch.
 * Saves via PATCH to /api/settings/*. Honest "Saved" confirmation (no fake success).
 */
export function SettingsForms({
  initialPrefs,
  initialCampus,
  campuses,
}: {
  initialPrefs: Record<string, "email" | "in_app" | "none">;
  initialCampus: string;
  campuses: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Record<string, "email" | "in_app" | "none">>(initialPrefs);
  const [campus, setCampus] = useState(initialCampus);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function savePrefs() {
    setBusy(true);
    setSaved(null);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs }),
      });
      if (res.ok) setSaved("Notification preferences saved.");
      else setSaved("Could not save preferences.");
    } finally {
      setBusy(false);
    }
  }

  async function saveCampus() {
    setBusy(true);
    setSaved(null);
    try {
      const res = await fetch("/api/settings/campus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campusId: campus }),
      });
      if (res.ok) {
        setSaved("Campus updated.");
        router.refresh();
      } else setSaved("Could not update campus.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="auth-card" style={{ marginTop: "var(--space-3)" }} data-testid="settings-notifications">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)" }}>Notifications</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {NOTIF_TYPES.map((t) => (
            <div key={t.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" }}>
              <span style={{ fontSize: 14 }}>{t.label}</span>
              <select
                data-testid={`notif-${t.key}`}
                value={prefs[t.key] ?? "in_app"}
                onChange={(e) => setPrefs((p) => ({ ...p, [t.key]: e.target.value as "email" | "in_app" | "none" }))}
                style={{ fontFamily: "var(--role-font-ui)", fontSize: 14, padding: 8, borderRadius: "var(--radius)", border: "1px solid var(--role-border)", background: "var(--role-surface)", color: "var(--role-text)" }}
              >
                <option value="in_app">In-app</option>
                <option value="email">Email</option>
                <option value="none">None</option>
              </select>
            </div>
          ))}
        </div>
        <button onClick={savePrefs} disabled={busy} data-testid="settings-save-notifs" className="auth-submit" style={{ marginTop: "var(--space-2)", display: "inline-block" }}>
          Save notification preferences
        </button>
      </section>

      <section className="auth-card" style={{ marginTop: "var(--space-3)" }} data-testid="settings-campus">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)" }}>Campus</h2>
        <select
          data-testid="settings-campus-select"
          value={campus}
          onChange={(e) => setCampus(e.target.value)}
          style={{ fontFamily: "var(--role-font-ui)", fontSize: 14, padding: 8, borderRadius: "var(--radius)", border: "1px solid var(--role-border)", background: "var(--role-surface)", color: "var(--role-text)" }}
        >
          {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={saveCampus} disabled={busy} data-testid="settings-save-campus" className="auth-submit" style={{ marginTop: "var(--space-2)", display: "inline-block" }}>
          Update campus
        </button>
      </section>

      {saved && <p data-testid="settings-saved" style={{ color: "var(--role-accent-strong)", fontSize: 14, marginTop: "var(--space-2)" }}>{saved}</p>}
    </>
  );
}
