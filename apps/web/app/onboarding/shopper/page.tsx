"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InfoPageShell } from "@/components/info/InfoPageShell";
import { categories } from "@voeq/data";

/**
 * VS3.1 — Shopper onboarding (Doc 03 FLOW-ONB-SHOP, Doc 08 §8.3).
 * Capture optional feed-interest tags. Skippable — on skip we still set
 * feedPrefsSetAt (default discovery). Selected tags persist to UserPreference.
 *
 * This is the LAST gate in the post-auth chain:
 *   verify-otp → /consent → /select-campus → /onboarding/shopper → /home
 */
export default function ShopperOnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggle(tagId: string) {
    setSelected((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    );
  }

  async function submit(tags: string[]) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/shopper/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interestTags: tags }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Even on unexpected error, fall through to home so the user isn't stuck.
        router.push("/home");
        return;
      }
      router.push(data.redirect ?? "/home");
    } catch {
      router.push("/home");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <InfoPageShell title="What are you interested in?">
      <div className="auth-card">
        <p className="auth-lede">
          Pick a few categories so we can tailor your campus feed. You can change
          this later — or skip and browse everything.
        </p>
        <div className="interest-chip-grid" role="group" aria-label="Interest categories">
          {categories.map((c) => {
            const active = selected.includes(c.id);
            return (
              <button
                type="button"
                key={c.id}
                className={`interest-chip${active ? " is-active" : ""}`}
                aria-pressed={active}
                onClick={() => toggle(c.id)}
                data-testid={`interest-${c.id}`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
        <div className="onboarding-actions">
          <button
            type="button"
            className="auth-submit"
            disabled={submitting}
            onClick={() => submit(selected)}
            data-testid="save-preferences"
          >
            {submitting ? "Saving…" : "Save preferences"}
          </button>
          <button
            type="button"
            className="auth-secondary"
            disabled={submitting}
            onClick={() => submit([])}
            data-testid="skip-preferences"
          >
            Skip for now
          </button>
        </div>
      </div>
    </InfoPageShell>
  );
}
