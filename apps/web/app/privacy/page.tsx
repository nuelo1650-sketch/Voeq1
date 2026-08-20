import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata = {
  title: "Privacy Policy",
  description: "How Voeq protects your data and privacy.",
};

export default function PrivacyPage() {
  return (
    <InfoPageShell title="Privacy Policy">
      <section>
        <h2>Data Collection</h2>
        <p>
          We collect only the information needed to connect you with campus
          vendors: your campus, contact preferences, and basic profile data.
        </p>
        {/* PLACEHOLDER */}
      </section>
      <section>
        <h2>Your Rights</h2>
        <p>
          You can request deletion of your account and data at any time. We do not
          sell your information to third parties.
        </p>
        {/* PLACEHOLDER */}
      </section>
    </InfoPageShell>
  );
}
