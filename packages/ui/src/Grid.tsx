import type { CSSProperties, ReactNode } from "react";

/** 12-column grid container. Respects container-max + responsive padding (B.4). */
export function Grid({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(var(--grid-cols), minmax(0, 1fr))`,
        gap: "var(--grid-gap)",
        width: "100%",
        maxWidth: "var(--container-max)",
        marginInline: "auto",
        paddingInline: "var(--container-pad)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A single grid column spanning `span` of 12 (clamped 1..12). */
export function Column({
  span = 12,
  children,
  style,
  className,
}: {
  span?: number;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  const clamped = Math.max(1, Math.min(12, span));
  return (
    <div
      className={className}
      style={{ gridColumn: `span ${clamped} / span ${clamped}`, ...style }}
    >
      {children}
    </div>
  );
}
