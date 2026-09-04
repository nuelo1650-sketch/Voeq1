import type { Metadata } from "next";

/**
 * Styleguide is a dev/verification artifact — never indexed.
 * (SEO batch 2026-09-04: also disallowed in robots.ts; this noindex covers
 * any crawler that ignores robots.txt.)
 */
export const metadata: Metadata = {
  title: "Styleguide | Voeq",
  robots: { index: false, follow: false },
};

export default function StyleguideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
