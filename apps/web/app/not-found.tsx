import Link from "next/link";

/**
 * Branded 404 for any unmatched route. Uses the design tokens so it matches the
 * rest of the app (forest/cream palette, Playfair display heading).
 */
export default function NotFound() {
  return (
    <main
      data-testid="not-found"
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
          fontSize: 72,
          color: "var(--color-forest)",
          margin: 0,
          lineHeight: 1,
        }}
      >
        404
      </h1>
      <p
        style={{
          color: "var(--color-ink-muted)",
          fontSize: 18,
          maxWidth: 440,
          margin: 0,
        }}
      >
        We couldn&apos;t find that page. It may have been moved or no longer
        exists.
      </p>
      <Link
        href="/home"
        data-testid="not-found-home"
        style={{
          padding: "10px 20px",
          fontSize: 14,
          fontWeight: 500,
          background: "var(--color-forest)",
          color: "var(--color-cream)",
          borderRadius: 6,
          textDecoration: "none",
        }}
      >
        Back to dashboard
      </Link>
    </main>
  );
}
