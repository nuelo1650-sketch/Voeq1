"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThumbsUp } from "lucide-react";

/**
 * LikeButton — persisted like toggle (VS6 — engagement).
 * Auth-gated: if unauthed, redirect to /login?next=<current path>.
 * If authed: POST /api/like, optimistic fill.
 * P-A round 11 (S1): on mount, GET /api/like?targetType&targetId to initialize
 * with the REAL current state (previously started false → first click reversed a
 * real like). Fetches only when the caller didn't pass initialLiked.
 */
export function LikeButton({
  targetType,
  targetId,
  initialLiked = false,
  className,
}: {
  targetType: "listing" | "vendor";
  targetId: string;
  initialLiked?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [liked, setLiked] = useState(initialLiked);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Async-check real state (S1): if caller gave explicit initialLiked, trust it.
    let active = true;
    if (initialLiked) return;
    fetch(`/api/like?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`, { method: "GET" })
      .then(async (res) => {
        if (!res.ok) return; // 401 or error — leave at false, login wall handles clicks
        const data = await res.json();
        if (active && typeof data.liked === "boolean") setLiked(data.liked);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [targetType, targetId, initialLiked]);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/like", {
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
        setLiked(Boolean(data.liked));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      onClick={onClick}
      className={`voeq-like${liked ? " is-liked" : ""}${className ? ` ${className}` : ""}`}
    >
      <ThumbsUp size={17} fill={liked ? "currentColor" : "none"} />
      {liked ? "Liked" : "Like"}
    </button>
  );
}
