"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThumbsUp } from "lucide-react";

/**
 * LikeButton — persisted like toggle (VS6 — engagement).
 * Auth-gated: if unauthed, redirect to /login?next=<current path>.
 * If authed: POST /api/like, optimistic fill.
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
