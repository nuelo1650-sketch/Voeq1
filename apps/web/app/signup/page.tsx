"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InfoPageShell } from "@/components/info/InfoPageShell";

const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\.[^\\s@]+$/;

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
        body: JSON.stringify({ email, password, name, intent, consent: true }),
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
