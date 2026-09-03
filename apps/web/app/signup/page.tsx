"use client";

import { useState, type FormEvent, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InfoPageShell } from "@/components/info/InfoPageShell";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { startGoogleOAuth } from "@/lib/googleOAuth";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type FieldErrors = Record<string, string>;

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [intent, setIntent] = useState<"shopper" | "vendor">("shopper");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  // D.6 — Render the Cloudflare Turnstile widget once the script loads.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !widgetRef.current) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !widgetRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(widgetRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        action: "signup",
        callback: (token: string) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(null),
        "error-callback": () => setTurnstileToken(null),
      });
    };
    if (window.turnstile) {
      render();
    } else {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.onload = render;
      document.head.appendChild(s);
    }
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, []);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Enter your name.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!consent) {
      // Hard precondition (Doc 04 PG-AUTH-001). Submit is disabled below,
      // but guard here too in case of programmatic submit.
      setErrors((p) => ({ ...p, consent: "Please accept the Terms and Privacy Policy." }));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, intent, consent: true, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) setErrors((p) => ({ ...p, ...data.fieldErrors }));
        setFormError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      // Pending token is opaque (D1): never the raw email.
      router.push(`/verify-otp?token=${encodeURIComponent(data.pendingToken)}&purpose=registration`);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <InfoPageShell title="Create your account">
      <div className="auth-card">
        <AuthHeader lede="One account for shopping and selling on campus. Choose how you're getting started." />
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Intent toggle */}
          <fieldset className="auth-intent" aria-label="Account type">
            <label className={intent === "shopper" ? "auth-intent-opt is-active" : "auth-intent-opt"}>
              <input
                type="radio"
                name="intent"
                value="shopper"
                checked={intent === "shopper"}
                onChange={() => setIntent("shopper")}
              />
              <span>Shopper</span>
              <small>Browse &amp; message vendors</small>
            </label>
            <label className={intent === "vendor" ? "auth-intent-opt is-active" : "auth-intent-opt"}>
              <input
                type="radio"
                name="intent"
                value="vendor"
                checked={intent === "vendor"}
                onChange={() => setIntent("vendor")}
              />
              <span>Vendor</span>
              <small>Sell to your campus</small>
            </label>
          </fieldset>

          <div className="auth-field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              value={name}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            {errors.name && <span className="auth-error" id="name-error" role="alert">{errors.name}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {errors.email && <span className="auth-error" id="email-error" role="alert">{errors.email}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            {errors.password && <span className="auth-error" id="password-error" role="alert">{errors.password}</span>}
          </div>

          <label className="auth-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-invalid={Boolean(errors.consent)}
            />
            <span>
              I agree to the <Link href="/terms">Terms of Service</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </span>
          </label>
          {errors.consent && <span className="auth-error" role="alert">{errors.consent}</span>}

          {/* D.6 — Cloudflare Turnstile widget. Renders only when a sitekey is configured. */}
          {TURNSTILE_SITE_KEY ? (
            <div
              ref={widgetRef}
              className="auth-turnstile"
              aria-label="Bot verification"
            />
          ) : null}

          {formError && <div className="auth-form-error" role="alert">{formError}</div>}

          <button
            type="submit"
            className="auth-submit"
            disabled={!consent || submitting}
            data-testid="signup-submit"
          >
            {submitting ? "Creating…" : "Create account"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* FIX #3: Google button respects consent checkbox (first-time acceptance) */}
        <button
          type="button"
          onClick={() => startGoogleOAuth()}
          className="auth-google-btn auth-google-btn-brand"
          disabled={!consent}
          data-testid="google-signup"
          style={{
            opacity: consent ? 1 : 0.5,
            cursor: consent ? "pointer" : "not-allowed",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" focusable="false" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        <p className="auth-alt">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
        <p className="auth-alt">
          <Link href="/">← Back to home</Link>
        </p>
      </div>
    </InfoPageShell>
  );
}
