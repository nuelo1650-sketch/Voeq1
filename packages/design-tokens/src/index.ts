/**
 * @voeq/design-tokens — role token metadata (TypeScript mirror of tokens.css).
 *
 * Components import the CSS (side-effect) for the actual values and read var(--role-*)
 * at runtime. This module exists so TS code can reference token *names* and environment
 * keys without hardcoding visual values. The source of truth for values is tokens.css.
 */

export type VoeqEnvironment = "cream" | "deep";

export const ENVIRONMENTS: readonly VoeqEnvironment[] = ["cream", "deep"] as const;

export const DEFAULT_ENVIRONMENT: VoeqEnvironment = "cream";

/** Role token names — components may reference these to build class/var strings. */
export const ROLE_TOKENS = {
  color: [
    "bg",
    "surface",
    "surface-sunken",
    "text",
    "text-muted",
    "border",
    "accent",
    "accent-strong",
    "gold",
    "danger",
    "on-accent",
  ],
  typography: ["font-display", "font-ui", "font-mono"],
  spacing: ["space-1", "space-2", "space-3", "space-4", "space-5", "space-6", "space-8"],
  grid: ["grid-cols", "grid-gap", "container-max", "container-pad"],
  shape: ["radius", "radius-lg", "shadow-1", "shadow-2"],
  motion: ["motion-fast", "motion-med", "motion-ease"],
} as const;

/** Set the active environment on <html> by toggling the data-env attribute. */
export function setEnvironment(env: VoeqEnvironment): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-env", env);
}

export function getEnvironment(): VoeqEnvironment {
  if (typeof document === "undefined") return DEFAULT_ENVIRONMENT;
  const attr = document.documentElement.getAttribute("data-env");
  return attr === "deep" ? "deep" : "cream";
}
