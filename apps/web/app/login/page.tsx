"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { InfoPageShell } from "@/components/info/InfoPageShell";

const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\.[^\\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember, next }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.redirect) {
          router.push(data.redirect);
          return;
        }
        setError(data.error ?? "Sign in failed.");
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
    <InfoPageShell title="Sign in">
      <div className="auth-card">
        <p className="auth-lede">Welcome back. Sign in to continue to Voeq.</p>
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
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <label className="auth-consent">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Keep me signed in</span>
          </label>
          {error && <div className="auth-form-error" id="login-error" role="alert">{error}</div>}
          <button type="submit" className="auth-submit" disabled={submitting} data-testid="login-submit">
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="auth-alt">
          <Link href="/forgot-password">Forgot password?</Link>
        </p>
        <p className="auth-alt">
          New to Voeq? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </InfoPageShell>
  );
}
