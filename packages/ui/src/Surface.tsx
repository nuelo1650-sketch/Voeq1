import type { CSSProperties, ReactNode } from "react";

/** A surface panel — consumes --role-surface; never hardcodes color. */
export function Surface({
  children,
  sunken = false,
  style,
  className,
  ...rest
}: {
  children: ReactNode;
  sunken?: boolean;
  style?: CSSProperties;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <div
      className={className}
      style={{
        background: sunken ? "var(--role-surface-sunken)" : "var(--role-surface)",
        border: "1px solid var(--role-border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-3)",
        boxShadow: "var(--shadow-1)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
