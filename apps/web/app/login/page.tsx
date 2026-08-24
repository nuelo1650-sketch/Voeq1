"use client";

import { Suspense, useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { InfoPageShell } from "@/components/info/InfoPageShell";
import { startGoogleOAuth } from "@/lib/googleOAuth";

const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [consentChecked, setConsentChecked] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // FIX #4: Listen for Turnstile success
  useEffect(() => {
    const handler = (e: CustomEvent) => setTurnstileToken(e.detail);
    document.addEventListener("turnstile-success", handler as EventListener);
    return () => document.removeEventListener("turnstile-success", handler as EventListener);
  }, []);

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
    if (!turnstileToken) {
      setError("Please complete the bot verification.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember, next, turnstileToken }),
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
          
          {/* FIX #4: Cloudflare Turnstile widget for bot protection */}
          {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
            <div className="auth-turnstile">
              <div
                className="cf-turnstile"
                data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                data-callback="onTurnstileSuccess"
                data-action="login"
              />
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    window.onTurnstileSuccess = function(token) {
                      window.turnstileToken = token;
                      document.dispatchEvent(new CustomEvent('turnstile-success', { detail: token }));
                    };
                  `,
                }}
              />
            </div>
          )}
          
          <button type="submit" className="auth-submit" disabled={submitting} data-testid="login-submit">
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* FIX #3: Consent checkbox required before Google OAuth */}
        <label className="auth-consent" style={{ marginBottom: "var(--space-3)" }}>
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            data-testid="google-consent-checkbox"
          />
          <span>
            I agree to the <Link href="/terms" target="_blank">Terms</Link> and{" "}
            <Link href="/privacy" target="_blank">Privacy Policy</Link>
          </span>
        </label>

        <button
          type="button"
          onClick={() => startGoogleOAuth()}
          className="auth-google-btn"
          disabled={!consentChecked}
          data-testid="google-login"
          style={{
            opacity: consentChecked ? 1 : 0.5,
            cursor: consentChecked ? "pointer" : "not-allowed",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.959H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.041l3.007-2.334z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.959L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
