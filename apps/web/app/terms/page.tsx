import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of service for the Voeq marketplace.",
};

export default function TermsPage() {
  return (
    <InfoPageShell title="Terms of Service">
      <section>
        <h2>Agreement</h2>
        <p>
          By using Voeq, you agree to use the platform responsibly and
          respectfully. This includes accurate listings, honest reviews, and fair
          treatment of other users.
        </p>
        {/* PLACEHOLDER */}
      </section>
      <section>
        <h2>User Responsibilities</h2>
        <p>
          You are responsible for the accuracy of your listings and your
          interactions with other users. Misuse of the platform may result in
          account suspension.
        </p>
        {/* PLACEHOLDER */}
      </section>
    </InfoPageShell>
  );
}
