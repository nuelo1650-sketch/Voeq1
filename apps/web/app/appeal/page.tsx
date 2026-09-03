"use client";

import { useState, useMemo, type FormEvent, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { InfoPageShell } from "@/components/info/InfoPageShell";
import { AuthHeader } from "@/components/auth/AuthHeader";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Staff batch 2 / T7 — the appeal page. Opened from the link inside every
 * enforcement notification (/appeal?t=<token>). The token is shown as a
 * locked "reference" chip (first/last chars) so users understand the link
 * IS their proof; they confirm their email and write their case.
 * No auth — the HMAC token in the URL is the credential.
 */
function AppealForm() {
  const params = useSearchParams();
  const token = params.get("t") ?? "";
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const tokenChip = useMemo(() => {
    if (!token) return null;
    return token.length > 16 ? `${token.slice(0, 8)}…${token.slice(-4)}` : token;
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter the email address on the account.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Please write at least a short sentence explaining why this is a mistake.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: email.trim(), message: message.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setDone(true);
        setUpdated(Boolean(data?.updated));
      } else if (data?.error === "invalid_token") {
        setError("This appeal link is not valid. Check you're using the link from your Voeq notification, or email support@voeq.ng.");
      } else if (data?.error === "too_many_attempts") {
        setError("Too many attempts — please wait a few minutes, or email support@voeq.ng.");
      } else if (data?.error === "message_too_short") {
        setError("Please tell us a bit more about why this is a mistake.");
      } else {
        setError("Something went wrong. Please try again or email support@voeq.ng.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-card">
        <AuthHeader lede="Appeal links come from Voeq enforcement notifications. If you received one, open the link from your notification inbox or email support@voeq.ng directly." />
        <p className="auth-alt">
          <Link href="/login">← Back to sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-card">
      {done ? (
        <>
          <AuthHeader
            lede={
              updated
                ? "Your appeal was updated and our team has been alerted. You'll hear back by email."
                : "Your appeal was submitted. Our team has been alerted and will reply to the email on your account."
            }
          />
          <p className="auth-alt">
            <Link href="/login">← Back to sign in</Link>
          </p>
        </>
      ) : (
        <>
          <AuthHeader lede="Tell us why you believe this decision is a mistake. A real person reviews every appeal." />
          {tokenChip && (
            <p style={{ fontSize: 12, color: "var(--muted-foreground, #6b7280)", margin: "0 0 12px" }}>
              Appeal reference: <code data-testid="appeal-ref">{tokenChip}</code>
            </p>
          )}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="email">Account email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "appeal-error" : undefined}
                data-testid="appeal-email"
              />
            </div>
            <div className="auth-field">
              <label htmlFor="message">Your appeal</label>
              <textarea
                id="message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                placeholder="What happened, and why you believe the decision was wrong…"
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--role-border, #d1d5db)", font: "inherit" }}
                data-testid="appeal-message"
              />
              {error && <span className="auth-error" id="appeal-error" role="alert">{error}</span>}
            </div>
            <button type="submit" className="auth-submit" disabled={submitting} data-testid="appeal-submit">
              {submitting ? "Submitting…" : "Submit appeal"}
            </button>
          </form>
          <p className="auth-alt">
            Link not working? Email <a href="mailto:support@voeq.ng">support@voeq.ng</a>.
          </p>
        </>
      )}
    </div>
  );
}

export default function AppealPage() {
  return (
    <InfoPageShell title="Appeal a decision">
      <Suspense fallback={null}>
        <AppealForm />
      </Suspense>
    </InfoPageShell>
  );
}
