"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getViewerSignedIn } from "@/components/shopper/auth-watch";
import { Heart } from "lucide-react";

/**
 * SaveButton — persisted save/wishlist toggle (VS4.2).
 * Auth-gated: if unauthed, redirect to /login?next=<current path> (Doc 03 §3.9).
 * If authed: POST /api/saved, optimistic heart fill.
 * P-A round 11 (S1): GET /api/saved?targetType&targetId to initialize with the
 * REAL saved state (previously false → first click reversed a real save).
 */
export function SaveButton({
  targetType,
  targetId,
  initialSaved = false,
  className,
  compact = false,
}: {
  targetType: "listing" | "vendor";
  targetId: string;
  initialSaved?: boolean;
  className?: string;
  /** C1 landing card (2026-09-06): frosted circle so the heart stays legible
   *  on any photo (the bare transparent icon vanished on light images). */
  compact?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // 401-NOISE FIX (2026-09-05): skip the state fetch entirely for
    // anonymous viewers — one deduped auth check per page (auth-watch),
    // zero unauthorized GETs from signed-out sessions.
    let active = true;
    if (initialSaved) return;
    getViewerSignedIn().then((signedIn) => {
      if (!active || !signedIn) return;
      fetch(`/api/saved?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`, { method: "GET" })
        .then(async (res) => {
          if (!res.ok) return;
          const data = await res.json();
          if (active && typeof data.saved === "boolean") setSaved(data.saved);
        })
        .catch(() => {});
    });
    return () => { active = false; };
  }, [targetType, targetId, initialSaved]);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSaved(Boolean(data.saved));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save"}
      onClick={onClick}
      className={className}
      style={compact ? {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: 999,
        background: "rgba(246,241,230,.92)",
        border: "1px solid rgba(15,42,29,.18)",
        cursor: "pointer",
        color: saved ? "var(--color-amber, #E8A33D)" : "var(--color-forest, #0F2A1D)",
        boxShadow: "0 1px 4px rgba(15,42,29,.18)",
        padding: 0,
      } : {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: saved ? "var(--role-accent-strong)" : "var(--role-text-muted)",
        padding: 6,
      }}
    >
      <Heart size={compact ? 15 : 18} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
