"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getViewerSignedIn } from "@/components/shopper/auth-watch";

/**
 * FollowButton — persisted follow toggle for a vendor (VS4.3).
 * Auth-gated: unauthed click → /login?next=<current path>.
 * P-A round 11 (S1): GET /api/follow?vendorId to initialize with real state
 * (previously always false → first click reversed a real follow).
 */
export function FollowButton({
  vendorId,
  initialFollowing = false,
  className,
  compact = false,
}: {
  vendorId: string;
  initialFollowing?: boolean;
  className?: string;
  /** C1 landing card (2026-09-06): small frosted pill for photo-corner use —
   *  the full-size pill overflowed the trending rail cards. */
  compact?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // 401-NOISE FIX (2026-09-05): skip for anonymous viewers (auth-watch).
    let active = true;
    if (initialFollowing) return;
    getViewerSignedIn().then((signedIn) => {
      if (!active || !signedIn) return;
      fetch(`/api/follow?vendorId=${encodeURIComponent(vendorId)}`, { method: "GET" })
        .then(async (res) => {
          if (!res.ok) return;
          const data = await res.json();
          if (active && typeof data.following === "boolean") setFollowing(data.following);
        })
        .catch(() => {});
    });
    return () => { active = false; };
  }, [vendorId, initialFollowing]);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId }),
      });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setFollowing(Boolean(data.following));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      aria-pressed={following}
      onClick={onClick}
      className={className}
      style={compact ? {
        // C1 landing card: small frosted pill — "+"/"✓" glyph, no text.
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: 999,
        fontFamily: "var(--role-font-ui)",
        fontSize: "15px",
        fontWeight: 700,
        lineHeight: 1,
        background: following ? "var(--color-forest, #0F2A1D)" : "rgba(246,241,230,.92)",
        color: following ? "#f6f1e6" : "var(--color-forest, #0F2A1D)",
        border: "1px solid rgba(15,42,29,.18)",
        cursor: "pointer",
        boxShadow: "0 1px 4px rgba(15,42,29,.18)",
      } : {
        fontFamily: "var(--role-font-ui)",
        fontSize: "15px",
        fontWeight: 600,
        padding: "12px 24px",
        borderRadius: "var(--radius)",
        border: "1px solid var(--role-accent-strong)",
        background: following ? "transparent" : "var(--role-accent-strong)",
        color: following ? "var(--role-accent-strong)" : "var(--role-on-accent)",
        cursor: "pointer",
      }}
    >
      {compact ? (following ? "✓" : "+") : (following ? "Following" : "Follow")}
    </button>
  );
}
