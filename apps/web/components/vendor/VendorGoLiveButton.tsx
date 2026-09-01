"use client";

import { useState } from "react";

/**
 * VendorGoLiveButton — P-A round 7 (A1).
 * The real "Go live" action. Previously the dashboard rendered step 3 as a
 * bare <li> with NO button — vendors could never become public from the UI
 * (only via API/tests). This button calls POST /api/vendor/go-live and shows
 * gate reasons (e.g. "no_listing") honestly.
 */
export function VendorGoLiveButton({ live }: { live: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(live);
  const [reasons, setReasons] = useState<string[]>([]);

  async function handleGoLive() {
    setBusy(true);
    setError(null);
    setReasons([]);
    try {
      const res = await fetch("/api/vendor/go-live", { method: "POST" });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not go live.");
        if (Array.isArray(data.reasons)) setReasons(data.reasons);
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p style={{ color: "var(--color-forest-mid)", margin: 0 }} data-testid="go-live-done">
        All caught up! Your storefront is live. 🎉
      </p>
    );
  }

  return (
    <div data-testid="go-live-control" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        type="button"
        onClick={handleGoLive}
        disabled={busy}
        data-testid="go-live-button"
        style={{
          fontFamily: "var(--role-font-ui)",
          fontSize: 14,
          fontWeight: 650,
          padding: "10px 18px",
          borderRadius: 999,
          border: "1px solid var(--color-forest)",
          background: "var(--color-forest)",
          color: "#f6f1e6",
          cursor: busy ? "wait" : "pointer",
          alignSelf: "flex-start",
        }}
      >
        {busy ? "Going live..." : "Go live"}
      </button>
      {error && (
        <p style={{ color: "var(--role-error, #B3261E)", margin: 0, fontSize: 13 }} data-testid="go-live-error">
          {error}
        </p>
      )}
      {reasons.length > 0 && (
        <p style={{ color: "var(--role-text-muted)", margin: 0, fontSize: 13 }}>
          {reasons.includes("no_listing")
            ? "You need at least one listing to go live."
            : Object.keys({ no_agreement: "Accept the agreement first." }).filter((k) => reasons.includes(k)).join(" ") ||
              "Check the requirements above, then try again."}
        </p>
      )}
    </div>
  );
}
