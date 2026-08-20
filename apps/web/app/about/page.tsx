import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata = {
  title: "About Voeq",
  description: "Voeq is the campus marketplace connecting students with the vendors already serving their school.",
};

export default function AboutPage() {
  return (
    <InfoPageShell title="About Voeq" subtitle='Pronounced "voke"'>
      <section>
        <p>
          Voeq is the campus marketplace connecting students with the vendors
          already serving their school — and the ones they&rsquo;ve probably never
          heard of. List for free, connect directly, and find what you need
          without the guesswork.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>Why We Exist</h2>
        <p>
          Campus life runs on vendors students already trust — but finding them,
          and connecting with them, is scattered and word-of-mouth. Voeq makes
          that easier, one connection at a time.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>How It Works</h2>
        <ol>
          <li>Pick your campus</li>
          <li>Browse listings</li>
          <li>Connect directly with the vendor</li>
        </ol>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>Built by Students, for Students</h2>
        <p>
          Voeq is currently live at NMU. The goal is to grow campus by campus
          across Nigeria over time.
        </p>
        {/* PLACEHOLDER */}
      </section>
    </InfoPageShell>
  );
}
