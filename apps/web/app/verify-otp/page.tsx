"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { InfoPageShell } from "@/components/info/InfoPageShell";

export default function VerifyOtpPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const purpose = params.get("purpose") ?? "registration";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <InfoPageShell title="Verify your email">
        <div className="auth-card">
          <div className="auth-form-error" role="alert">
            This verification link is missing or invalid.
          </div>
          <p className="auth-alt">
            <Link href="/signup">Start sign up again</Link>
          </p>
        </div>
      </InfoPageShell>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        return;
      }
      router.push(data.redirect ?? "/consent");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <InfoPageShell title="Verify your email">
      <div className="auth-card">
        <p className="auth-lede">
          We sent a 6-digit code to your email. Enter it below to finish creating your account.
        </p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="code">6-digit code</label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "code-error" : undefined}
              data-testid="otp-code"
            />
            {error && <span className="auth-error" id="code-error" role="alert">{error}</span>}
          </div>
          <button type="submit" className="auth-submit" disabled={submitting} data-testid="otp-submit">
            {submitting ? "Verifying…" : "Verify"}
          </button>
        </form>
        <p className="auth-alt">
          <Link href="/signup">← Use a different email</Link>
        </p>
      </div>
    </InfoPageShell>
  );
}
