import type { CSSProperties, ReactNode } from "react";

/** Vertical/horizontal rhythm using the 8pt spacing scale (B.3). Token-only. */
export function Stack({
  space = 2,
  children,
  style,
  className,
}: {
  space?: 1 | 2 | 3 | 4 | 5 | 6 | 8;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: `var(--space-${space})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
