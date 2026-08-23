"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * K3c.7 — Impersonation banner.
 * Full-width amber banner when admin is impersonating another user.
 * Shows target name, countdown, and end button.
 */

interface ImpersonationBannerProps {
  targetName: string;
  targetEmail: string;
  expiresAt: Date;
}

export function ImpersonationBanner({ targetName, targetEmail, expiresAt }: ImpersonationBannerProps) {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState("");
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining("Expired");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}m ${seconds}s`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const endImpersonation = async () => {
    setEnding(true);
    try {
      const res = await fetch("/api/staff/impersonate/end", { method: "POST" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to end impersonation");
      }
    } catch {
      alert("Network error");
    } finally {
      setEnding(false);
    }
  };

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#FFA726",
        color: "#3E2723",
        padding: "12px 16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        <AlertTriangle size={20} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)" }}>
            Viewing as {targetName} ({targetEmail})
          </p>
          <p style={{ margin: 0, fontSize: 12, marginTop: 2, opacity: 0.9 }}>
            All actions are logged. Time remaining: {timeRemaining}
          </p>
        </div>
      </div>
      <button
        onClick={endImpersonation}
        disabled={ending}
        style={{
          padding: "8px 16px",
          background: "#3E2723",
          color: "#FFA726",
          border: "none",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: ending ? "not-allowed" : "pointer",
          opacity: ending ? 0.7 : 1,
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <X size={16} />
        {ending ? "Ending..." : "End impersonation"}
      </button>
    </div>
  );
}
