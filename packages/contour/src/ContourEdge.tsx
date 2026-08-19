import type { CSSProperties } from "react";

/**
 * ContourEdge — a thin boundary line at ≤12% opacity (B.11 edge-whisper rule).
 * Decorative ONLY when there is content to frame; it is a structural primitive,
 * not a "fake activity" generator. It never invents geography or liveliness.
 *
 * `intensity` (2026-08-18, Explore/Editorial tier): "structural" (default, ~12%
 * opacity hairline), "whisper" (explore's calm edge, slightly lower), "strong"
 * (Landing's strongest tier). Explore passes "whisper" per Doc 05 B.12.
 */
const INTENSITY_OPACITY: Record<string, number> = {
  structural: 0.12,
  whisper: 0.08,
  strong: 0.18,
};

export function ContourEdge({
  intensity = "structural",
  style,
  className,
  ...rest
}: {
  intensity?: "structural" | "whisper" | "strong";
  style?: CSSProperties;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        height: 1,
        background: "var(--role-border)",
        opacity: INTENSITY_OPACITY[intensity] ?? 0.12,
        ...style,
      }}
      {...rest}
    />
  );
}
