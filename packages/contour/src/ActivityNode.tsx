import type { CSSProperties } from "react";

export interface ActivityNodeData {
  /** Stable id for the underlying real activity (e.g. a listing event). */
  id: string;
  /** Intensity 0..1 derived from REAL data — never synthesized. */
  intensity: number;
  label?: string;
}

/**
 * ActivityNode — renders a single contour node for ONE unit of REAL activity.
 * It does NOT generate nodes; it renders what `data` provides. With no data,
 * it renders nothing (B.12 / A.12: contour only where content warrants).
 */
export function ActivityNode({
  data,
  style,
  className,
  ...rest
}: {
  data?: ActivityNodeData;
  style?: CSSProperties;
  className?: string;
  [key: string]: unknown;
}) {
  if (!data) return null;
  const clamped = Math.max(0, Math.min(1, data.intensity));
  return (
    <span
      aria-hidden="true"
      className={className}
      title={data.label}
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "var(--role-accent)",
        opacity: 0.2 + clamped * 0.8,
        ...style,
      }}
      {...rest}
    />
  );
}
