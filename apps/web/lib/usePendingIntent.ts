"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useRef } from "react";
import { parseIntent, type PendingIntent } from "./postAuth";

/**
 * Phase 1 — usePendingIntent()
 *
 * Reads a pending `intent=` query param (set by the login/consent flow after a
 * user was gated by auth), and hands it to the caller so the original action
 * can RESUME. Once consumed, the intent is stripped from the URL so it never
 * re-fires on a refresh or re-navigation (the old "keeps taking me to auth"
 * loop).
 *
 * Usage:
 *   const { pending, consume } = usePendingIntent();
 *   useEffect(() => {
 *     if (pending?.kind === "message") { ...resume...; consume(); }
 *   }, [pending]);
 */
export function usePendingIntent(): {
  pending: PendingIntent | null;
  consume: () => void;
} {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const consumedRef = useRef(false);

  const raw = params.get("intent");
  const pending = raw && !consumedRef.current ? parseIntent(raw) : null;

  const consume = useCallback(() => {
    consumedRef.current = true;
    // Strip intent from the URL so it can't re-fire. Keep any other query params.
    const next = new URLSearchParams(params.toString());
    next.delete("intent");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, params, router]);

  return { pending, consume };
}

/** Convenience: encode an intent and build the gated URL (used by action handlers). */
export { withIntent, intentToQuery } from "./postAuth";
