import type { ReactNode } from "react";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

interface InfoPageShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * InfoPageShell — shared chrome for public info pages (Phase B, PG-PUB-009).
 * Reuses LandingNav + LandingFooter (no duplication). Cream inherited from
 * layout.tsx (data-env="cream"). Content column capped at 65ch via .info-page-shell.
 * Server component (no "use client") so route pages can still export `metadata`.
 */
export function InfoPageShell({ title, subtitle, children }: InfoPageShellProps) {
  return (
    <>
      <LandingNav />
      <main className="info-page-shell" data-testid="info-page-shell">
        <h1 data-testid="info-page-title">{title}</h1>
        {subtitle ? <p className="info-page-subtitle">{subtitle}</p> : null}
        {children}
      </main>
      <LandingFooter />
    </>
  );
}
