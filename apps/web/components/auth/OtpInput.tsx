"use client";

import { useRef, type ClipboardEvent } from "react";

/**
 * Single-field OTP input (2026-08-29 redesign).
 * Replaces the old 6-box row that overflowed the auth card on mobile and
 * showed near-invisible digits (invalid --color-forest-dark var).
 *
 * - ONE wide input, letter-spaced digits (reads like • • • • • • boxes)
 * - paste anywhere in the field works (whole code lands)
 * - only digits accepted (typed or pasted), max 6
 * - auto-submit via onComplete when the 6th digit lands
 * - same controlled contract as before: value + onChange + onComplete,
 *   so verify-otp page logic is untouched.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  error,
}: {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function commit(next: string) {
    const clean = next.replace(/\D/g, "").slice(0, 6);
    onChange(clean);
    if (clean.length === 6 && onComplete) onComplete(clean);
  }

  function handleChange(raw: string) {
    commit(raw);
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    // Let the default paste happen; the digits-only sanitize in handleChange
    // cleans whatever lands. Nothing to do here — paste simply works.
    void e;
  }

  return (
    <input
      ref={inputRef}
      className={`auth-otp-single${error ? " is-error" : ""}`}
      data-testid="otp-input"
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d*"
      maxLength={6}
      placeholder="••••••"
      value={value}
      disabled={disabled}
      aria-label="6-digit verification code"
      aria-invalid={Boolean(error)}
      onChange={(e) => handleChange(e.target.value)}
      onPaste={handlePaste}
      onFocus={(e) => e.target.select()}
      dir="ltr"
      style={{ textAlign: "center", letterSpacing: "0.55em", textIndent: "0.55em" }}
    />
  );
}
