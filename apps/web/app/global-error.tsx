"use client";

/**
 * App-level fallback. Unlike `error.tsx`, this replaces the ROOT layout, so it
 * must render its own <html> and <body>. Used only for catastrophic errors
 * that bubble past every route boundary. Hard-coded tokens (not CSS vars)
 * because the root stylesheet may not have loaded.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#f7f4ee",
          fontFamily: "Inter, system-ui, sans-serif",
          padding: 24,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "Playfair Display, Georgia, serif",
            fontSize: 36,
            color: "#1f4d3a",
            margin: 0,
          }}
        >
          Something went wrong
        </h1>
        <p style={{ color: "#6b6b6b", fontSize: 16, maxWidth: 420, margin: 0 }}>
          A critical error occurred. Please reload the page.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 500,
            background: "#1f4d3a",
            color: "#f7f4ee",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
