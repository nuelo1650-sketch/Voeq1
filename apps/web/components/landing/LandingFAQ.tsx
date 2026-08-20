"use client";

const FAQ = [
  {
    q: "Is Voeq free to use?",
    a: "Yes. Voeq is free for students to browse and connect with vendors.",
  },
  {
    q: "How do I contact a vendor?",
    a: "Tap “Message vendor” on any listing to start a conversation. No phone number needed.",
  },
  {
    q: "Can I sell on Voeq?",
    a: "Yes. Any student or campus vendor can sign up and list items.",
  },
  {
    q: "Is my data safe?",
    a: "We only collect what's needed to connect you with vendors. We never sell your data.",
  },
  {
    q: "What campuses are supported?",
    a: "We're starting with Nigerian universities. Select your campus to see what's open near you.",
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
