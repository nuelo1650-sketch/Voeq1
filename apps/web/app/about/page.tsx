import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata = {
  title: "About Voeq",
  description: "Voeq is a student-powered marketplace for campus commerce.",
};

export default function AboutPage() {
  return (
    <InfoPageShell title="About Voeq" subtitle="Student commerce, reimagined.">
      <section>
        <h2>Our Mission</h2>
        <p>
          Voeq connects students with the vendors and services on their campus.
          We believe campus commerce should be simple, transparent, and built for
          the people who use it every day.
        </p>
        {/* PLACEHOLDER */}
      </section>
      <section>
        <h2>What We Do</h2>
        <p>
          We help students discover what&rsquo;s open near them, from food and
          fashion to electronics and services. Every listing comes from a
          verified campus vendor.
        </p>
        {/* PLACEHOLDER */}
      </section>
    </InfoPageShell>
  );
}
