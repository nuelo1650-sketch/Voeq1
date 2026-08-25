"use client";

import { Suspense, useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { InfoPageShell } from "@/components/info/InfoPageShell";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { OtpInput } from "@/components/auth/OtpInput";

function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const _purpose = params.get("purpose") ?? "registration";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

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

  async function handleResend() {
    setError(null);
    setCanResend(false);
    setResendTimer(60);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        setError("Could not resend code. Please try again.");
        setCanResend(true);
      }
    } catch {
      setError("Network error.");
      setCanResend(true);
    }
  }

  return (
    <InfoPageShell title="Verify your email">
      <div className="auth-card">
        <AuthHeader lede="Enter the 6-digit code we sent to your email to finish creating your account." />
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="code" className="sr-only">6-digit code</label>
            <OtpInput
              value={code}
              onChange={(next) => setCode(next)}
              onComplete={(c) => {
                setCode(c);
                // auto-submit when all 6 entered
                void (async () => {
                  setError(null);
                  setSubmitting(true);
                  try {
                    const res = await fetch("/api/auth/verify-otp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ token, code: c }),
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
                })();
              }}
              disabled={submitting}
              error={Boolean(error)}
            />
            {error && <span className="auth-error" id="code-error" role="alert">{error}</span>}
          </div>
          <button type="submit" className="auth-submit" disabled={submitting || code.length !== 6} data-testid="otp-submit">
            {submitting ? "Verifying…" : "Verify"}
          </button>
        </form>
        <p className="auth-alt">
          {canResend ? (
            <button type="button" onClick={handleResend} className="auth-link-btn">
              Resend code
            </button>
          ) : (
            <span>Resend code in {resendTimer}s</span>
          )}
        </p>
        <p className="auth-alt">
          <Link href="/signup">← Use a different email</Link>
        </p>
      </div>
    </InfoPageShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpForm />
    </Suspense>
  );
}
