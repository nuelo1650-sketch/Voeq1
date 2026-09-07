"use client";

// LANDING FAQ (2026-09-06, founder report: "landing page has no faq"): the
// original LandingFAQ was deleted in the dead-code sweep (909cb86) because it
// had ZERO importers — it was orphaned, never mounted. Restored and mounted
// on the landing page for launch. Answers match the /help page facts (free,
// in-app messaging, no payments processed, self-reported verification).
// Content is plain JSX text — no &apos; entity traps (see help page fix).

const FAQ = [
  {
    q: "Is Voeq free to use?",
    a: "Yes. Voeq is completely free for students to browse, and free for vendors to list. No commissions, no hidden fees.",
  },
  {
    q: "How do I contact a vendor?",
    a: "Tap “Message vendor” on any listing or storefront to start a conversation. Chat happens right here on Voeq — no phone number needed.",
  },
  {
    q: "Can I sell on Voeq?",
    a: "Yes. Any student or campus business can sign up as a vendor and post listings — food, fashion, tech, services and more.",
  },
  {
    q: "How do payments work?",
    a: "Voeq does not process payments. You agree on a price and pay the vendor directly (cash, transfer, however you choose).",
  },
  {
    q: "Are vendors verified?",
    a: "The ✓ badge means Voeq's team has reviewed that vendor's profile. We don't independently check business details, so always use your judgment — like you would with any campus service.",
  },
  {
    q: "What campuses are supported?",
    a: "We're starting with Nigerian universities. Select your campus to see what's open near you — and tell us if yours is missing.",
  },
];

export function LandingFAQ() {
  return (
    <section data-testid="landing-faq" className="landing-section landing-faq">
      <h2 className="landing-section-title">Frequently asked questions</h2>
      <div className="faq-list">
        {FAQ.map((item, i) => (
          <details key={item.q} className="faq-item" data-testid="faq-item" open={i === 0}>
            <summary className="faq-question">{item.q}</summary>
            <p className="faq-answer">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
