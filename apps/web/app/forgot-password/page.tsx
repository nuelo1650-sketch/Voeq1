"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InfoPageShell } from "@/components/info/InfoPageShell";
import { AuthHeader } from "@/components/auth/AuthHeader";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function ForgotPasswordPage() {
  const _router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always treat as success (anti-enumeration) regardless of status.
      if (res.ok) {
        setDone(true);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <InfoPageShell title="Reset your password">
      <div className="auth-card">
        {done ? (
          <>
            <AuthHeader lede="If an account exists for that email, we've sent a reset link. Check your inbox (and spam) for a message from Voeq." />
            <p className="auth-alt">
              <Link href="/login">← Back to sign in</Link>
            </p>
          </>
        ) : (
          <>
            <AuthHeader lede="Enter your email and we'll send a secure link to reset your password." />
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "fp-error" : undefined}
                />
                {error && <span className="auth-error" id="fp-error" role="alert">{error}</span>}
              </div>
              <button type="submit" className="auth-submit" disabled={submitting} data-testid="forgot-submit">
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <p className="auth-alt">
              Remembered it? <Link href="/login">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </InfoPageShell>
  );
}
