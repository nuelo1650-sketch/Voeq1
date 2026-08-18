import type { CSSProperties } from "react";

/**
 * ContourEdge — a thin boundary line at ≤12% opacity (B.11 edge-whisper rule).
 * Decorative ONLY when there is content to frame; it is a structural primitive,
 * not a "fake activity" generator. It never invents geography or liveliness.
 */
export function ContourEdge({
  style,
  className,
}: {
  style?: any;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        height: 1,
        background: "var(--role-border)",
        opacity: 0.12,
        ...(style as CSSProperties),
      }}
    />
  );
}
