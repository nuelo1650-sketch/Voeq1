"use client";

import { useRouter } from "next/navigation";

/**
 * L3 (2026-09-06) — context-aware back affordance (loop dissolution, Option B).
 *
 * The explore<->storefront loop: StorefrontHero linked "← Explore" absolutely;
 * listing detail linked "← Back to Explore"; detail's "More from this vendor"
 * linked the storefront; the storefront's rails linked back out. Every trail
 * through a vendor's orbit cycled.
 *
 * This replaces the hardcoded cross-links: when the visitor ARRIVED from
 * somewhere (explore, search, another page) we go BACK the way they came;
 * only a direct entry (shared link, QR, refresh) falls back to the given
 * destination. Content rails stay — they're recommendations, not back-links.
 */
export function ContextBack({
  fallback = "/explore",
  label = "← Back",
  testid = "context-back",
  style,
}: {
  fallback?: string;
  label?: string;
  testid?: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  return (
    <a
      href={fallback}
      data-testid={testid}
      onClick={(e) => {
        // If there is in-app history, go back the way the user came; only a
        // direct entry (no trail) follows the fallback href.
        if (typeof window !== "undefined" && window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
      style={{ cursor: "pointer", ...style }}
    >
      {label}
    </a>
  );
}
