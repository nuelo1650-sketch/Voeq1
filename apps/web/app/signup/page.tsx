"use client";

import { useState, type FormEvent, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InfoPageShell } from "@/components/info/InfoPageShell";

const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\.[^\\s@]+$/;
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
    if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address.";
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
        <p className="auth-lede">
          One account for shopping and selling on campus. Choose how you&rsquo;re getting started.
        </p>

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

        <button
          type="button"
          onClick={() => window.location.href = '/api/auth/google'}
          className="auth-google-btn"
          data-testid="google-signup"
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
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
        <p className="auth-alt">
          <Link href="/">← Back to home</Link>
        </p>
      </div>
    </InfoPageShell>
  );
}
