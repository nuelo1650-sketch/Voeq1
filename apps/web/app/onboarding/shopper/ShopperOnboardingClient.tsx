"use client";

// This page is fully interactive (interest-tag selection, hover handlers).
// Mark it dynamic so Next does not attempt static prerender of the Client
// Component (inline event handlers cannot be serialized to static HTML).
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Utensils, Shirt, Laptop, Sparkles, BookOpen, Printer, Camera, Scissors, Package, MoreHorizontal, Check } from "lucide-react";

/**
 * VS3.1 + K3a.5 — Shopper onboarding (Doc 03 FLOW-ONB-SHOP, Doc 08 §8.3).
 * Modern card layout with interest tags. Capture optional feed-interest tags.
 * Skippable — on skip we still set feedPrefsSetAt (default discovery).
 * Selected tags persist to UserPreference. Revisit shows current selection.
 *
 * This is the LAST gate in the post-auth chain:
 *   verify-otp → /consent → /select-campus → /onboarding/shopper → /home
 */

const INTEREST_CATEGORIES = [
  { id: "food-drinks", label: "Food & Drinks", icon: Utensils },
  { id: "fashion", label: "Fashion", icon: Shirt },
  { id: "tech", label: "Tech", icon: Laptop },
  { id: "beauty", label: "Beauty", icon: Sparkles },
  { id: "academic", label: "Academic", icon: BookOpen },
  { id: "printing", label: "Printing", icon: Printer },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "tailoring", label: "Tailoring", icon: Scissors },
  { id: "logistics", label: "Logistics", icon: Package },
  { id: "other", label: "Other", icon: MoreHorizontal },
];

export default function ShopperOnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load existing preferences if revisiting
  useEffect(() => {
    fetch("/api/me/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.interestTags && Array.isArray(d.interestTags)) {
          setSelected(d.interestTags);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const toggle = (tagId: string) => {
    setSelected((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const submit = async (tags: string[]) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/shopper/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interestTags: tags }),
      });
      const data = await res.json();
      if (!res.ok) {
        router.push("/home");
        return;
      }
      router.push(data.redirect ?? "/home");
    } catch {
      router.push("/home");
    } finally {
      setSubmitting(false);
    }
  };

  if (!loaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-3)",
          background: "var(--color-glass-white)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid var(--color-ink-subtle)",
            borderTopColor: "var(--color-forest)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "var(--color-ink-muted)" }}>Loading your preferences…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      data-testid="shopper-onboarding"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-glass-white)",
        padding: "var(--space-3)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 680,
          background: "var(--color-cream)",
          border: "1px solid var(--color-ink-subtle)",
          borderRadius: 16,
          padding: "var(--space-4)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        {/* Step indicator */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--color-ink-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "var(--space-2)",
          }}
        >
          Step 1 of 1
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 32,
            margin: 0,
            marginBottom: 12,
            color: "var(--color-forest)",
            lineHeight: 1.2,
          }}
        >
          What are you interested in?
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 16,
            color: "var(--color-ink-muted)",
            margin: 0,
            marginBottom: "var(--space-4)",
            lineHeight: 1.5,
          }}
        >
          Pick a few — we&apos;ll show you vendors that match. You can always change these later.
        </p>

        {/* Interest tag grid */}
        <div
          className="interest-grid"
          role="group"
          aria-label="Interest categories"
        >
          {INTEREST_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isSelected = selected.includes(category.id);
            
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggle(category.id)}
                aria-pressed={isSelected}
                data-testid={`interest-${category.id}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "20px 16px",
                  background: isSelected ? "var(--color-forest-light)" : "var(--color-glass-white)",
                  color: "var(--color-forest)",
                  border: isSelected ? "2px solid var(--color-forest)" : "2px solid var(--color-ink-subtle)",
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease",
                  position: "relative",
                  minHeight: 100,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Icon size={24} strokeWidth={2} />
                <span style={{ fontSize: 14, fontWeight: 600, textAlign: "center" }}>
                  {category.label}
                </span>
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "var(--color-amber)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={14} strokeWidth={3} color="var(--color-forest)" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Responsive grid: 2 cols mobile, 3 tablet, 5 desktop — scoped, no !important hack */}
        <style>{`
          .interest-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: var(--space-4);
          }
          @media (min-width: 600px) {
            .interest-grid { grid-template-columns: repeat(3, 1fr); }
          }
          @media (min-width: 900px) {
            .interest-grid { grid-template-columns: repeat(5, 1fr); }
          }
          .interest-grid > button { min-width: 0; }
          .interest-grid span {
            min-width: 0;
            word-break: break-word;
            overflow-wrap: anywhere;
          }
        `}</style>

        {/* Bottom actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            paddingTop: "var(--space-3)",
            borderTop: "1px solid var(--color-ink-subtle)",
          }}
        >
          <button
            type="button"
            onClick={() => submit([])}
            disabled={submitting}
            data-testid="skip-preferences"
            style={{
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 500,
              background: "transparent",
              color: "var(--color-ink-muted)",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-forest)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-ink-muted)";
            }}
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={() => submit(selected)}
            disabled={selected.length === 0 || submitting}
            data-testid="save-preferences"
            style={{
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              background: selected.length === 0 ? "var(--color-ink-subtle)" : "var(--color-forest)",
              color: "var(--color-cream)",
              border: "none",
              borderRadius: 8,
              cursor: selected.length === 0 ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: selected.length > 0 ? "0 2px 8px rgba(15, 42, 29, 0.2)" : "none",
            }}
            onMouseEnter={(e) => {
              if (selected.length > 0 && !submitting) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(15, 42, 29, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = selected.length > 0 ? "0 2px 8px rgba(15, 42, 29, 0.2)" : "none";
            }}
          >
            {submitting ? "Saving…" : "Save preferences"}
          </button>
        </div>

        {/* Selection count indicator */}
        {selected.length > 0 && (
          <p
            style={{
              marginTop: 12,
              fontSize: 13,
              color: "var(--color-forest-mid)",
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            {selected.length} {selected.length === 1 ? "interest" : "interests"} selected
          </p>
        )}
      </div>
    </div>
  );
}
