import type { Metadata } from "next";
import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata: Metadata = {
  title: "Careers — Voeq",
  description: "Join the team building the campus marketplace.",
};

export default function CareersPage() {
  return (
    <InfoPageShell title="Careers">
      <div className="info-page-content">
        <section className="info-section">
          <p className="info-lead">
            We\'re building the campus marketplace that connects students with 
            vendors across Nigerian universities. If you\'re interested in solving 
            real problems for real users, we\'d love to hear from you.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">Why Voeq</h2>
          <p>
            Campus commerce is scattered — group chats, Instagram DMs, 
            word-of-mouth recommendations. Students waste time hunting for basics. 
            Great vendors go undiscovered. We\'re building the platform that brings 
            it all together.
          </p>
          <p>
            Voeq is early-stage. That means you\'ll have real ownership, real impact, 
            and the chance to shape how millions of students discover and connect 
            with campus vendors.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">What We Value</h2>
          <ul className="info-list">
            <li>Shipping fast over perfection (we iterate based on real usage)</li>
            <li>Solving user problems, not building features for the sake of it</li>
            <li>Clear communication over assumptions</li>
            <li>Ownership and autonomy</li>
            <li>Building for Nigerian students, by people who understand the context</li>
          </ul>
        </section>

        <section className="info-section">
          <h2 className="info-heading">Open Roles</h2>
          <p className="info-muted">
            We\'re not actively hiring at the moment, but we\'re always open to 
            meeting talented people who are excited about what we\'re building.
          </p>
          <p>
            If you\'re a developer, designer, marketer, or campus community builder 
            interested in Voeq, reach out. We\'re particularly interested in people 
            who have lived the campus experience and understand the pain points 
            we\'re solving.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">Get in Touch</h2>
          <p>
            Send your CV, portfolio, or just an introduction to:{' '}
            <a href="mailto:careers@voeq.ng" className="info-link">careers@voeq.ng</a>
          </p>
          <p className="info-muted">
            Tell us what you\'re interested in working on and why Voeq. We read 
            every email.
          </p>
        </section>
      </div>
    </InfoPageShell>
  );
}
