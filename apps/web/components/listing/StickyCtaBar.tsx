"use client";

/**
 * StickyCtaBar (Money Bag D1, A15) — mobile-only floating action bar for the
 * listing detail: Message (primary) + save + share round buttons.
 *
 * - Phones only (<768px) — desktop keeps the inline CTA (no duplication).
 * - HIDES while the main Message CTA is in view (IntersectionObserver) so
 *   the user never sees two Message buttons at once; reappears after it
 *   scrolls away — that's the whole point: the CTA is always reachable.
 * - Safe-area padding for iPhone home indicator. No motion (B2-safe).
 */

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

export function StickyCtaBar({
  onMessage,
  authLoading,
  saveSlot,
  shareSlot,
  mainCtaSelector,
}: {
  onMessage: () => void;
  authLoading: boolean;
  saveSlot: React.ReactNode;
  shareSlot: React.ReactNode;
  mainCtaSelector: string;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [mainCtaVisible, setMainCtaVisible] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const target = document.querySelector(mainCtaSelector);
    if (!target) return;
    const io = new IntersectionObserver(
      (entries) => setMainCtaVisible(entries[0]?.isIntersecting ?? false),
      { threshold: 0.15 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [isMobile, mainCtaSelector]);

  if (!isMobile || mainCtaVisible) return null;

  return (
    <div
      data-testid="listing-sticky-cta"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px calc(10px + env(safe-area-inset-bottom))",
        background: "var(--role-surface, #fffef9)",
        borderTop: "1px solid var(--role-border)",
        boxShadow: "0 -8px 24px rgba(15,42,29,0.12)",
      }}
    >
      {saveSlot}
      {shareSlot}
      <button
        data-testid="listing-sticky-message"
        onClick={onMessage}
        disabled={authLoading}
        style={{
          flex: 1,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          border: "none",
          background: "var(--color-forest, #0F2A1D)",
          color: "#f6f1e6",
          borderRadius: 999,
          padding: "13px 0",
          fontSize: 15,
          fontWeight: 700,
          cursor: authLoading ? "wait" : "pointer",
        }}
      >
        <MessageCircle size={18} />
        Message the vendor
      </button>
    </div>
  );
}
