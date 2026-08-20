import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata = {
  title: "Privacy Policy",
  description: "How Voeq collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <InfoPageShell title="Privacy Policy">
      <p className="legal-updated">Last updated: [date]</p>

      <section>
        <h2>1. What We Collect</h2>
        <ul>
          <li>Account information: name, email, campus, password (for students and vendors)</li>
          <li>Vendor listing details: business name, category, description, campus location, contact information</li>
          <li>Usage data: pages visited, listings viewed, messages sent through the platform&rsquo;s connection feature</li>
        </ul>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To create and manage your account</li>
          <li>To display vendor listings to students on the relevant campus</li>
          <li>To facilitate connection between students and vendors through in-platform messaging</li>
          <li>To improve the platform and understand usage patterns</li>
          <li>To communicate updates, including through our WhatsApp channel/community if you choose to join</li>
        </ul>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>3. What We Don&rsquo;t Collect</h2>
        <p>
          Voeq does not process payments and does not collect or store payment
          card information, bank details, or financial account numbers.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>4. Sharing of Information</h2>
        <p>
          We do not sell user data. Vendor contact information is shown to
          students specifically to enable connection, as intended by the
          platform. We may share limited data with service providers who help
          operate the platform (e.g., hosting, analytics), bound by
          confidentiality obligations.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>5. Vendor Presence Disclaimer</h2>
        <p>
          Vendor claims about their campus presence are self-reported and not
          independently verified by Voeq. This policy does not constitute a
          guarantee of any vendor&rsquo;s identity or legitimacy.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>6. Data Retention</h2>
        <p>
          We retain account and listing data for as long as your account is
          active, and for a reasonable period afterward for legal and operational
          purposes.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>7. Your Rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal
          data by contacting support@voeq.ng.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>8. Security</h2>
        <p>
          We take reasonable measures to protect your data but cannot guarantee
          absolute security of information transmitted online.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>9. Changes to This Policy</h2>
        <p>
          This policy may be updated as Voeq&rsquo;s features change, including
          with the introduction of in-platform payments in a future phase. We
          will note the &ldquo;last updated&rdquo; date above.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>support@voeq.ng</p>
        {/* PLACEHOLDER */}
      </section>
    </InfoPageShell>
  );
}
