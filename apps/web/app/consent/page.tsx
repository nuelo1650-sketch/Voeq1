"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { InfoPageShell } from "@/components/info/InfoPageShell";

/**
 * VS2.7 / VS3.1 — Consent gate (server-authoritative, Doc 09 §9.4/§9.22).
 * This page was referenced by every post-auth route in VS2 but never built;
 * VS3.1 creates it and wires the post-auth chain:
 *   verify-otp → /consent → (accept) → /select-campus → /onboarding/shopper → /home
 *
 * Consent is recorded server-side via the consent repo; this page only collects
 * the checkbox and POSTs acceptance. It does NOT bypass the gate.
 */
export default function ConsentPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agreed) {
      setError("You must accept the Terms and Privacy Policy to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/consent", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not record consent.");
        return;
      }
      router.push(data.redirect ?? "/select-campus");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <InfoPageShell title="Review & accept">
      <div className="auth-card">
        <p className="auth-lede">
          Before you start, please review our Terms of Service and Privacy Policy.
          Acceptance is recorded and required to use Voeq.
        </p>
        <div className="auth-consent-versions">
          <p className="auth-help-text">
            Terms of Service v1.0 (effective Jan 1, 2026) &middot; Privacy Policy v1.0 (effective Jan 1, 2026)
          </p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-checkbox-row">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              aria-describedby="consent-help"
              data-testid="consent-checkbox"
            />
            <span>
              I have read and accept the{" "}
              <a href="/terms" target="_blank" rel="noreferrer">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" rel="noreferrer">
                Privacy Policy
              </a>
              .
            </span>
        </label>
        <p id="consent-help" className="auth-help-text">
          Consent is stored against your account and can be reviewed later in settings.
        </p>
        {error && (
          <div className="auth-form-error" role="alert">
            {error}
          </div>
        )}
        <button
          type="submit"
          className="auth-submit"
          disabled={submitting || !agreed}
          data-testid="consent-submit"
        >
          {submitting ? "Saving…" : "Continue"}
        </button>
        </form>
      </div>
    </InfoPageShell>
  );
}
