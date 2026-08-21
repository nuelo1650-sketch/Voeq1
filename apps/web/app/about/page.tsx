import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata = {
  title: "About Voeq",
  description: "Voeq is the campus marketplace connecting students with the vendors already serving their school.",
};

export default function AboutPage() {
  return (
    <InfoPageShell title="About Voeq">
      <div className="info-page-content">
        <section className="info-section">
          <p className="info-lead">
            Voeq (pronounced "voke") is the campus marketplace connecting students 
            with vendors serving their school — from food delivery to fashion, 
            services to supplies.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">Why We Built This</h2>
          <p>
            Campus commerce happens through scattered group chats, Instagram 
            DMs, and word of mouth. Great vendors go undiscovered. Students waste 
            time hunting for basics. Voeq brings it all into one place.
          </p>
          <p>
            Whether you\'re looking for late-night food, a tailor who gets it right, 
            or someone to print your project, Voeq helps you find and connect with 
            vendors already trusted by students on your campus.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">How It Works</h2>
          <ol className="info-list">
            <li>Pick your campus</li>
            <li>Browse vendors by category or search</li>
            <li>Connect directly — no middleman, no fees</li>
          </ol>
          <p>
            Vendors list for free. Students discover and connect for free. We just 
            make the introduction.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">Growing Campus by Campus</h2>
          <p>
            Voeq is built to scale across campuses, starting with select schools 
            and expanding based on demand. Each campus gets its own marketplace 
            tailored to the vendors and services students actually use.
          </p>
          <p>
            Interested in bringing Voeq to your campus? Reach out — we\'re listening.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">Contact</h2>
          <p>
            Questions, feedback, or partnership inquiries:{' '}
            <a href="mailto:hello@voeq.ng" className="info-link">hello@voeq.ng</a>
          </p>
        </section>
      </div>
    </InfoPageShell>
  );
}
