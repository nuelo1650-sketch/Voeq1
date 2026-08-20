"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useReveal — one-shot scroll reveal via native IntersectionObserver.
 * Progressive enhancement: content is VISIBLE by default (no opacity:0 in markup
 * or base CSS). We only apply the hidden/transition state once we know JS + IO
 * exist, by toggling a `data-reveal` attribute. If JS fails or IO is unsupported,
 * nothing is ever hidden — content stays fully visible (no empty-page regression).
 * Reduced motion → reveal immediately, no transition.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // Mark as JS-enhanced so CSS only hides AFTER we know we can reveal it.
    el.setAttribute("data-reveal", "pending");

    if (prefersReduced) {
      el.setAttribute("data-reveal", "visible");
      setRevealed(true);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      // No IO support → just show it.
      el.setAttribute("data-reveal", "visible");
      setRevealed(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.setAttribute("data-reveal", "visible");
            setRevealed(true);
            io.disconnect(); // one-shot only
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, revealed };
}
