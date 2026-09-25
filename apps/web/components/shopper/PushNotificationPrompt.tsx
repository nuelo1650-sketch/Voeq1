"use client";

import { useState, useEffect } from "react";

const PROMPT_KEY = "voeq:push-prompt-declined";

export function PushNotificationPrompt({ viewerRole = "shopper" }: { viewerRole?: "shopper" | "vendor" }) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<"banner" | "browser">("banner");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const declined = localStorage.getItem(PROMPT_KEY);
    if (declined) {
      const ts = parseInt(declined, 10);
      if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000) return;
    }
    if (Notification.permission === "default") {
      const t = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  const copy = viewerRole === "vendor"
    ? "Get notified instantly when a student messages you — never miss a sale."
    : "Get notified instantly when a vendor replies to you.";

  const handleAllow = async () => {
    setStep("browser");
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      await subscribe();
    } else {
      localStorage.setItem(PROMPT_KEY, Date.now().toString());
    }
    setShow(false);
    setStep("banner");
  };

  const handleDecline = () => {
    localStorage.setItem(PROMPT_KEY, Date.now().toString());
    setShow(false);
  };

  const subscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC });
      fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...sub.toJSON(), identityId: "me" }) });
    } catch {}
  };

  if (!show) return null;

  return (
    <div data-testid="push-prompt" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999, padding: 16, background: "var(--color-forest)", color: "var(--color-cream)" }}>
      {step === "browser" ? (
        <p style={{ margin: 0, textAlign: "center" }}>Check your browser's address bar to allow notifications.</p>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, maxWidth: 600, margin: "0 auto" }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{copy}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleDecline} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "var(--color-cream)", cursor: "pointer", fontSize: 13 }}>Not now</button>
            <button onClick={handleAllow} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--color-amber)", color: "var(--color-ink)", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Allow</button>
          </div>
        </div>
      )}
    </div>
  );
}
