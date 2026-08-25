"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

/**
 * D3: 6-box OTP input. Auto-advances on digit entry, backspace moves left,
 * paste fills all six. Controlled via `value` (the 6-char string) + `onChange`.
 * Submits the same 6-digit string the API already expects — no contract change.
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
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.split("").slice(0, 6);

  function setAt(i: number, d: string) {
    const arr = value.split("").slice(0, 6);
    while (arr.length < 6) arr.push("");
    arr[i] = d;
    const next = arr.join("").replace(/\s/g, "");
    onChange(next);
    if (next.length === 6 && !next.includes("") && onComplete) onComplete(next);
  }

  function handleChange(i: number, raw: string) {
    const d = raw.replace(/\D/g, "").slice(-1);
    if (!d) {
      setAt(i, "");
      return;
    }
    setAt(i, d);
    if (i < 5) refs.current[i + 1]?.focus();
  }

  function handleKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    refs.current[focusIdx]?.focus();
    if (pasted.length === 6 && onComplete) onComplete(pasted);
  }

  return (
    <div className="auth-otp-row" role="group" aria-label="6-digit verification code">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={`auth-otp-cell${error ? " is-error" : ""}`}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digits[i] ?? ""}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
