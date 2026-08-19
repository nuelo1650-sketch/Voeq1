"use client";

import { useEffect, useState } from "react";
import { Type } from "@voeq/ui";

const WORD = "Voeq";

/**
 * LandingHero — the arrival moment (Doc 05 A.3 / A.19).
 * Display wordmark, char-split "ink settling into paper" entrance (~1.8s total,
 * staggered V→o→e→q), first-arrival only (sessionStorage gate), reduced-motion →
 * instant (A.15). Semantic <h1> for SEO/a11y; display size comes from Type.tsx
 * (LOCKED clamp(5rem,14vw,8rem) — single source of truth, not re-specified here).
 */
export function LandingHero() {
  const [play, setPlay] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("voeq:wordmark-played")) {
      setPlay(false); // returning visitor in this session — stay still
      return;
    }
    sessionStorage.setItem("voeq:wordmark-played", "1");
  }, []);

  return (
    <h1
      data-testid="landing-heading"
      aria-label={WORD}
      style={{ margin: 0, display: "flex", gap: "0.01em", lineHeight: 0.88 }}
    >
      {WORD.split("").map((ch, i) => (
        <Type
          key={i}
          tone="display"
          size="display"
          data-testid="wordmark-char"
          className={play ? "wordmark-char" : "wordmark-char wordmark-char--instant"}
          style={{
            display: "inline-block",
            animationDelay: `${i * 0.3}s`,
            letterSpacing: "-0.04em",
            lineHeight: 0.88,
            textShadow: "0 1px 0 rgba(184,137,59,0.18)",
          }}
        >
          {ch}
        </Type>
      ))}
    </h1>
  );
}
