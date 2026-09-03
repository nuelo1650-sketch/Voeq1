"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { ReportCategory } from "@voeq/data";

const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "not_on_campus", label: "Not actually on campus" },
  { value: "scam", label: "Scam or fraud" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "impersonation", label: "Impersonation" },
  { value: "harassment", label: "Harassment" },
  { value: "other", label: "Other" },
];

/**
 * ReportForm — creates a real staff case (VS4.6). Auth-gated: unauthed →
 * /login?next=<current path>. Honest "submitted" confirmation (no fake send).
 */
export function ReportForm({
  targetType,
  targetId,
  onDone,
}: {
  targetType: "listing" | "vendor";
  targetId: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [category, setCategory] = useState<ReportCategory>("not_on_campus");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, category, body: body.trim() || null }),
      });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (res.ok) {
        // P-A round 78 (FIX 'report submitted with no feedback'): onDone()
        // closed the panel IMMEDIATELY, unmounting the success state before
        // the user ever saw 'Report submitted'. Show the confirmation first;
        // the panel stays open with the done message (user closes via the
        // Report button which toggles reportOpen off).
        setDone(true);
      } else {
        const d = await res.json().catch(() => ({}));
        setErr(d.error ?? "Could not submit report.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p data-testid="report-done" style={{ color: "var(--role-text-muted)", fontSize: 14, fontFamily: "var(--role-font-ui)" }}>
        Report submitted. Our team will review it.
      </p>
    );
  }

  return (
    <form onSubmit={submit} data-testid="report-form" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <select
        data-testid="report-category"
        value={category}
        onChange={(e) => setCategory(e.target.value as ReportCategory)}
        style={{ fontFamily: "var(--role-font-ui)", fontSize: 14, padding: 10, borderRadius: "var(--radius)", border: "1px solid var(--role-border)", background: "var(--role-surface)", color: "var(--role-text)" }}
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      <textarea
        data-testid="report-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add details (optional)"
        rows={3}
        style={{ width: "100%", fontFamily: "var(--role-font-ui)", fontSize: 14, padding: 10, borderRadius: "var(--radius)", border: "1px solid var(--role-border)", background: "var(--role-surface)", color: "var(--role-text)", resize: "vertical" }}
      />
      {err && <span data-testid="report-error" style={{ fontSize: 13, color: "var(--role-danger)" }}>{err}</span>}
      <button type="submit" disabled={busy} data-testid="report-submit" style={{ alignSelf: "flex-start", fontFamily: "var(--role-font-ui)", fontWeight: 600, fontSize: 14, padding: "10px 18px", borderRadius: "var(--radius)", border: "none", background: "var(--role-danger)", color: "#fff", cursor: busy ? "default" : "pointer" }}>
        {busy ? "Submitting…" : "Submit report"}
      </button>
    </form>
  );
}
