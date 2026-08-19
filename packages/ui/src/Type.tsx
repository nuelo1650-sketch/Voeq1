import type { CSSProperties, ReactNode } from "react";

type Tone = "body" | "display" | "muted" | "accent" | "gold" | "danger";

const FONT: Record<Tone, string> = {
  body: "var(--role-font-ui)",
  display: "var(--role-font-display)",
  muted: "var(--role-font-ui)",
  accent: "var(--role-font-ui)",
  gold: "var(--role-font-ui)",
  danger: "var(--role-font-ui)",
};

const COLOR: Record<Tone, string> = {
  body: "var(--role-text)",
  display: "var(--role-text)",
  muted: "var(--role-text-muted)",
  accent: "var(--role-accent)",
  gold: "var(--role-gold)",
  danger: "var(--role-danger)",
};

/** Type role renderer — font + color come from tokens, never hardcoded. */
export function Type({
  tone = "body",
  size = "md",
  children,
  style,
  className,
  ...rest
}: {
  tone?: Tone;
  size?: "sm" | "md" | "lg" | "xl" | "display";
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  [key: string]: unknown;
}) {
  const sizeMap: Record<string, string> = {
    sm: "0.875rem",
    md: "1rem",
    lg: "1.25rem",
    xl: "1.75rem",
    display: "clamp(5rem, 14vw, 8rem)", // LOCKED final ceiling 8rem (Doc 05 A.19/C.7) — founder decision, not tunable
  };
  return (
    <span
      className={className}
      style={{
        fontFamily: FONT[tone],
        color: COLOR[tone],
        fontSize: sizeMap[size],
        lineHeight: size === "display" ? 1.05 : 1.5,
        fontWeight: tone === "display" || size === "display" ? 600 : 400,
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
