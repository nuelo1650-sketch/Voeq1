"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { InfoPageShell } from "@/components/info/InfoPageShell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <InfoPageShell title="Reset your password">
        <div className="auth-card">
          <div className="auth-form-error" role="alert">
            This reset link is missing or invalid.
          </div>
          <p className="auth-alt">
            <Link href="/forgot-password">Request a new link</Link>
          </p>
        </div>
      </InfoPageShell>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Reset failed.");
        return;
      }
      router.push(data.redirect ?? "/login");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <InfoPageShell title="Choose a new password">
      <div className="auth-card">
        <p className="auth-lede">Enter a new password for your account.</p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              aria-invalid={Boolean(error)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error && <div className="auth-form-error" id="rp-error" role="alert">{error}</div>}
          <button type="submit" className="auth-submit" disabled={submitting} data-testid="reset-submit">
            {submitting ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </InfoPageShell>
  );
}
