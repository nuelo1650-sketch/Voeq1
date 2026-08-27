"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary. Catches errors thrown in any route segment below
 * the root layout and renders a branded, recoverable fallback (not Next's
 * default 500). `reset` re-renders the segment; the diganostic ref is shown
 * for support triage.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this is the hook for an error reporter (Sentry, etc.).
    console.error("[route-error]", error);
  }, [error]);

  return (
    <main
      data-testid="error-boundary"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-3)",
        background: "var(--color-glass-white)",
        padding: "var(--space-4)",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 40,
          color: "var(--color-forest)",
          margin: 0,
        }}
      >
        Something went wrong
      </h1>
      <p
        style={{
          color: "var(--color-ink-muted)",
          fontSize: 16,
          maxWidth: 440,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        We hit an unexpected error loading this page. Your data is safe — you can
        try again or head back to your dashboard.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: "var(--space-2)", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          data-testid="error-retry"
          style={{
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 500,
            background: "var(--color-forest)",
            color: "var(--color-cream)",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <Link
          href="/home"
          data-testid="error-home"
          style={{
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 500,
            background: "transparent",
            color: "var(--color-forest)",
            border: "1px solid var(--color-ink-subtle)",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Back to dashboard
        </Link>
      </div>
      {error?.digest && (
        <p style={{ color: "var(--color-ink-subtle)", fontSize: 12, margin: 0, marginTop: "var(--space-2)" }}>
          Ref: {error.digest}
        </p>
      )}
    </main>
  );
}
