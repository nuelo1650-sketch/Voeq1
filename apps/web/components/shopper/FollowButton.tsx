"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * FollowButton — persisted follow toggle for a vendor (VS4.3).
 * Auth-gated: unauthed click → /login?next=<current path>.
 */
export function FollowButton({
  vendorId,
  initialFollowing = false,
  className,
}: {
  vendorId: string;
  initialFollowing?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

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
      style={{
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
      {following ? "Following" : "Follow"}
    </button>
  );
}
