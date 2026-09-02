"use client";

import { usePathname } from "next/navigation";
import { LandingFooter } from "@/components/landing/LandingFooter";

/**
 * SmartFooter (P-A round 56) — the REAL fix for "footer on dashboards/onboarding/
 * explore/admin".
 *
 * WHY the bug existed: LandingFooter was rendered in the ROOT layout
 * (layout.tsx:77) — which wraps EVERY route, so every app surface inherited
 * the public marketing footer. The root layout can't know the pathname
 * (server component), and route groups for ALL app pages was a bigger move.
 *
 * What: public pages keep the footer; app surfaces (dashboards, onboarding,
 * explore, auth flows, admin) get a quiet spacing stop instead.
 */
const PUBLIC_PREFIXES = [
  "/", // landing — but see exact-match logic below
];

function isPublicPage(pathname: string): boolean {
  // Exact public pages (marketing + legal). Per David: footer belongs ONLY on
  // public-facing pages — NEVER dashboards, onboarding, explore, admin,
  // messages, auth flows. Explore is a product surface; no footer.
  const exacts = ["/", "/how-it-works", "/for-vendors", "/become-vendor", "/terms", "/privacy", "/about", "/contact", "/faq", "/help"];
  return exacts.includes(pathname);
}

export function SmartFooter() {
  const pathname = usePathname();
  if (!isPublicPage(pathname)) return null;
  return <LandingFooter />;
}
