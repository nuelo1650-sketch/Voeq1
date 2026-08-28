"use client";

import { useState, useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { CampusSelector } from "./CampusSelector";

interface OnboardingBannerProps {
  currentCampus: string;
  onCampusChange: (campusId: string) => void;
}

export function OnboardingBanner({ currentCampus, onCampusChange }: OnboardingBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onboarded = localStorage.getItem("voeq:onboarded-explore");
    if (!onboarded) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("voeq:onboarded-explore", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      data-testid="onboarding-banner"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "16px 20px",
        marginBottom: "var(--space-3)",
        background: "var(--color-cream)",
        border: "1px solid var(--color-forest)",
        borderRadius: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <MapPin size={20} style={{ color: "var(--color-forest)", flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "var(--color-ink-deep)", marginBottom: 4 }}>
              Pick your campus to see nearby vendors
            </div>
            <div style={{ fontSize: 13, color: "var(--color-ink-muted)", lineHeight: 1.5 }}>
              Select your university and we&rsquo;ll show you listings from vendors on your campus.
            </div>
          </div>
        </div>
        <button
          data-testid="onboarding-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: "var(--color-ink-muted)",
            flexShrink: 0,
          }}
        >
          <X size={18} />
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>Campus:</span>
        <CampusSelector currentCampus={currentCampus} onChange={onCampusChange} />
      </div>
    </div>
  );
}
