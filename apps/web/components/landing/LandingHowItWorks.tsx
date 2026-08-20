"use client";

import { useReveal } from "./useReveal";

const STEPS = [
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" strokeLinecap="round" />
      </svg>
    ),
    title: "Pick your campus",
    body: "Select your university to see what's open near you.",
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-5A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
        <line x1="8" y1="11" x2="16" y2="11" strokeLinecap="round" />
        <line x1="8" y1="14" x2="13" y2="14" strokeLinecap="round" />
      </svg>
    ),
    title: "Browse listings",
    body: "Explore food, fashion, electronics, and services from student vendors.",
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M7 11V8a5 5 0 0 1 10 0v3" strokeLinecap="round" />
        <path d="M5 11h14v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9Z" strokeLinejoin="round" />
        <path d="M12 15v2" strokeLinecap="round" />
      </svg>
    ),
    title: "Message & pickup",
    body: "Contact vendors directly and arrange pickup on campus.",
  },
];

export function LandingHowItWorks() {
  const { ref } = useReveal<HTMLDivElement>();
  return (
    <section data-testid="landing-how-it-works" ref={ref} className="landing-section landing-how-it-works">
      <h2 className="landing-section-title">How it works</h2>
      <div className="how-steps">
        {STEPS.map((s, i) => (
          <div key={s.title} className="how-step" data-step={i + 1}>
            <span className="how-step-icon" aria-hidden="true">{s.icon}</span>
            <h3 className="how-step-title">{s.title}</h3>
            <p className="how-step-body">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
