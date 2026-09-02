"use client";
import { InfoPageShell } from "@/components/info/InfoPageShell";
import { Search, MessageSquare, ShoppingBag, ShieldCheck, MapPin, UserPlus } from "lucide-react";

/**
 * /how-it-works — presentational page (2026-08-31). The landing nav/footer
 * link to /how-it-works but no route existed -> 404 for users. This mirrors
 * the landing "How Voeq works" section as a standalone page, same warm style.
 */
const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create your account",
    description: "Sign up in seconds with your email. Pick your campus — we verify real Nigerian campuses so you always see what's near you.",
  },
  {
    number: "02",
    icon: Search,
    title: "Discover",
    description: "Browse verified vendors across 10+ product categories on your campus. Real listings, real prices, real reviews.",
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Connect",
    description: "Message vendors directly through Voeq's in-app chat. No middleman, no markup, no hassle.",
  },
  {
    number: "04",
    icon: ShoppingBag,
    title: "Grow",
    description: "Support student entrepreneurs building their dreams. Your purchase powers their journey.",
  },
];

const badges = [
  { icon: MapPin, label: "Campus-verified vendors only" },
  { icon: ShieldCheck, label: "Real reviews from real students" },
];

export default function HowItWorksPage() {
  return (
    <InfoPageShell>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "var(--space-6) var(--space-3)" }}>
        <h1 style={{ fontFamily: "var(--role-font-display)", fontSize: "clamp(1.8rem, 5vw, 2.6rem)", color: "var(--color-forest)", marginBottom: "var(--space-2)" }}>
          How Voeq works
        </h1>
        <p style={{ color: "var(--role-text-muted)", marginBottom: "var(--space-5)" }}>
          The campus marketplace for Nigerian students — find, connect, and grow with people on your own campus.
        </p>

        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.number} style={{ display: "flex", gap: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-lg)", background: "var(--role-surface)", border: "1px solid var(--role-border)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: "50%", background: "var(--color-forest)", color: "#f6f1e6", flexShrink: 0 }}>
                  <Icon size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "var(--color-amber)", textTransform: "uppercase" }}>
                    Step {s.number}
                  </div>
                  <div style={{ fontFamily: "var(--role-font-display)", fontSize: "1.1rem", color: "var(--color-forest)", marginTop: 2 }}>
                    {s.title}
                  </div>
                  <p style={{ margin: "4px 0 0", color: "var(--role-text-muted)", fontSize: "0.95rem" }}>{s.description}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "var(--space-4)" }}>
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <span key={b.label} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, border: "1px solid rgba(208,170,90,.35)", background: "rgba(232,163,61,.08)", color: "var(--color-forest)", fontSize: "0.85rem", fontWeight: 500 }}>
                <Icon size={15} style={{ color: "var(--color-amber)" }} />
                {b.label}
              </span>
            );
          })}
        </div>

        <p style={{ marginTop: "var(--space-5)", color: "var(--role-text-muted)", fontSize: "0.9rem" }}>
          Ready to start? <a href="/signup" style={{ color: "var(--color-forest)", fontWeight: 600 }}>Sign up free</a> — or{" "}
          <a href="/for-vendors" style={{ color: "var(--color-forest)", fontWeight: 600 }}>see what it takes to become a vendor</a>.
        </p>
      </div>
    </InfoPageShell>
  );
}
