import type { ButtonHTMLAttributes } from "react";

/**
 * Button primitive. Visuals are token-driven; the focus ring is the global
 * :focus-visible rule (B.8) — not per-component inline styling.
 */
export function Button({
  children,
  variant = "primary",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const base: React.CSSProperties = {
    fontFamily: "var(--role-font-ui)",
    fontSize: "1rem",
    fontWeight: 600,
    padding: "var(--space-1) var(--space-2)",
    borderRadius: "var(--radius)",
    border: "1px solid transparent",
    cursor: "pointer",
    transition: "background var(--motion-fast) var(--motion-ease)",
  };
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      ...base,
      background: "var(--role-accent)",
      color: "var(--role-on-accent)",
    },
    ghost: {
      ...base,
      background: "transparent",
      color: "var(--role-text)",
      borderColor: "var(--role-border)",
    },
  };
  return (
    <button type="button" style={styles[variant]} {...rest}>
      {children}
    </button>
  );
}
