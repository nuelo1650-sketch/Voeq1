"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
}: {
  targetType: "listing" | "vendor";
  targetId: string;
  initialSaved?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (initialSaved) return;
    fetch(`/api/saved?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`, { method: "GET" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (active && typeof data.saved === "boolean") setSaved(data.saved);
      })
      .catch(() => {});
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
      style={{
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
      <Heart size={18} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
