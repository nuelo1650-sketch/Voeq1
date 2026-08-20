import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata = {
  title: "Help",
  description: "Frequently asked questions about using Voeq.",
};

export default function HelpPage() {
  return (
    <InfoPageShell title="Help">
      <section>
        <h2>Discovery</h2>
        <dl>
          <dt>How do I find listings near my campus?</dt>
          <dd>{/* PLACEHOLDER */}</dd>
          <dt>Can I filter by category?</dt>
          <dd>{/* PLACEHOLDER */}</dd>
        </dl>
      </section>
      <section>
        <h2>Messaging</h2>
        <dl>
          <dt>How do I message a seller?</dt>
          <dd>{/* PLACEHOLDER */}</dd>
          <dt>Is my conversation private?</dt>
          <dd>{/* PLACEHOLDER */}</dd>
        </dl>
      </section>
      <section>
        <h2>Accounts</h2>
        <dl>
          <dt>How do I create an account?</dt>
          <dd>{/* PLACEHOLDER */}</dd>
          <dt>How do I verify my student status?</dt>
          <dd>{/* PLACEHOLDER */}</dd>
        </dl>
      </section>
    </InfoPageShell>
  );
}
