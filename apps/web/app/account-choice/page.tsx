"use client";

/**
 * /account-choice (Money Bag F2 SAFETY NET) — the one-time "I'm shopping /
 * I'm selling" screen. Shown ONLY when a fresh identity has no intent and no
 * vendorId (a Google user whose intent never arrived). Picking a side sets
 * identity.intent and routes into the matching onboarding — Google never
 * decides for the user.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Store } from "lucide-react";

export default function AccountChoicePage() {
  const router = useRouter();
  const [busy, setBusy] = useState<"shopper" | "vendor" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (intent: "shopper" | "vendor") => {
    setBusy(intent);
    setError(null);
    try {
      const res = await fetch("/api/account-choice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Could not save your choice. Try again.");
        setBusy(null);
        return;
      }
      router.push(intent === "vendor" ? "/onboarding/vendor" : "/onboarding/shopper");
    } catch {
      setError("Network error");
      setBusy(null);
    }
  };

  const card = (kind: "shopper" | "vendor", icon: React.ReactNode, title: string, sub: string) => (
    <button
      data-testid={`account-choice-${kind}`}
      onClick={() => choose(kind)}
      disabled={busy !== null}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 10,
        width: "100%",
        textAlign: "left",
        padding: "20px 18px",
        borderRadius: 18,
        border: "1.5px solid var(--role-border)",
        background: "var(--role-surface, #fffef9)",
        cursor: busy && busy !== kind ? "wait" : "pointer",
        opacity: busy && busy !== kind ? 0.5 : 1,
        transition: "transform .3s cubic-bezier(.2,.6,.2,1), box-shadow .3s ease",
      }}
      onMouseEnter={(e) => { if (!busy) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 26px rgba(15,42,29,0.12)"; } }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <span
        aria-hidden
        style={{
          width: 46, height: 46, borderRadius: 14,
          background: "var(--forest-deep, #0F2A1D)",
          color: "var(--color-amber, #E8A33D)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {icon}
      </span>
      <span>
        <b style={{ display: "block", fontFamily: "var(--role-font-display)", fontSize: 19, color: "var(--forest-deep, #0F2A1D)" }}>{title}</b>
        <small style={{ display: "block", fontSize: 13.5, color: "var(--role-muted)", lineHeight: 1.5, marginTop: 4 }}>{sub}</small>
      </span>
    </button>
  );

  return (
    <main
      data-testid="account-choice"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "var(--role-surface, #F5F1E8)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 460 }}>
        <p
          style={{
            fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--amber-dark, #D4922A)", textAlign: "center", margin: "0 0 10px",
          }}
        >
          One quick question
        </p>
        <h1
          style={{
            fontFamily: "var(--role-font-display)", fontWeight: 900,
            fontSize: "clamp(26px, 7vw, 34px)", color: "var(--forest-deep, #0F2A1D)",
            textAlign: "center", lineHeight: 1.1, margin: 0,
          }}
        >
          What brings you to Voeq?
        </h1>

        <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
          {card("shopper", <ShoppingBag size={22} />, "I'm shopping", "Find things you need from people on your campus — chat before you commit.")}
          {card("vendor", <Store size={22} />, "I'm selling", "Open your stall, list what you sell, reach students around you.")}
        </div>

        {error && (
          <p role="alert" style={{ color: "var(--color-danger, #b3261e)", fontSize: 13.5, textAlign: "center", marginTop: 14 }}>
            {error}
          </p>
        )}

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 12.5, color: "var(--role-muted)" }}>
          You can always change later —{" "}
          <Link href="/help" style={{ color: "var(--forest-deep, #0F2A1D)", fontWeight: 600 }}>
            here's how Voeq works
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
