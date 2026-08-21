import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata = {
  title: "Privacy Policy",
  description: "How Voeq collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <InfoPageShell title="Privacy Policy">
      <div className="info-page-content">
        <p className="info-date">Last updated: August 21, 2026</p>

        <section className="info-section">
          <p>
            Voeq ("we," "us") is committed to protecting your privacy. This 
            Privacy Policy explains how we collect, use, share, and protect 
            information when you use voeq.ng.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">1. What We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="info-list">
            <li>
              <strong>Account information:</strong> Name, email address, campus 
              affiliation, and password (for students and vendors who create accounts)
            </li>
            <li>
              <strong>Vendor listing details:</strong> Business name, category, 
              description, campus location, contact information (in-app messaging handle)
            </li>
            <li>
              <strong>Usage data:</strong> Pages visited, listings viewed, search 
              queries, device information, IP address, and browser type
            </li>
            <li>
              <strong>Communications:</strong> Messages sent through the platform's 
              connection features, if applicable
            </li>
          </ul>
        </section>

        <section className="info-section">
          <h2 className="info-heading">2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="info-list">
            <li>Create and manage your account</li>
            <li>Display vendor listings to students on the relevant campus</li>
            <li>Facilitate connection between students and vendors</li>
            <li>Improve the platform and understand usage patterns</li>
            <li>Communicate updates via email or through community channels 
            if you choose to join</li>
            <li>Prevent fraud, abuse, and violations of our Terms of Service</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="info-section">
          <h2 className="info-heading">3. What We Don't Collect</h2>
          <p>
            Voeq does not process payments and does not collect or store payment 
            card information, bank account details, or financial account numbers.
          </p>
          <p>
            Any financial transactions between students and vendors occur entirely 
            outside the platform and are not visible to or tracked by Voeq.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">4. Sharing of Information</h2>
          <p>
            <strong>We do not sell your personal data.</strong> We may share 
            information in the following circumstances:
          </p>
          <ul className="info-list">
            <li>
              <strong>Public listings:</strong> Vendor contact information is 
              displayed publicly to students to enable direct connection, as 
              intended by the platform
            </li>
            <li>
              <strong>Service providers:</strong> We share limited data with 
              third-party service providers who help operate the platform (e.g., 
              hosting, analytics, email delivery), bound by confidentiality 
              obligations
            </li>
            <li>
              <strong>Legal compliance:</strong> We may disclose information if 
              required by law, court order, or government request
            </li>
            <li>
              <strong>Business transfers:</strong> In the event of a merger, 
              acquisition, or sale of assets, user data may be transferred to 
              the acquiring entity
            </li>
          </ul>
        </section>

        <section className="info-section">
          <h2 className="info-heading">5. Vendor Presence Disclaimer</h2>
          <p>
            Vendor claims about their campus presence, business details, and 
            contact information are self-reported and not independently verified 
            by Voeq. This Privacy Policy does not constitute a guarantee of any 
            vendor's identity, legitimacy, or accuracy of information provided.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">6. Data Retention</h2>
          <p>
            We retain account and listing data for as long as your account is 
            active. After account deletion, we retain certain data for a reasonable 
            period for legal, operational, and fraud prevention purposes.
          </p>
          <p>
            Anonymized usage data may be retained indefinitely for analytics and 
            platform improvement.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">7. Your Rights</h2>
          <p>Depending on your location, you may have the following rights:</p>
          <ul className="info-list">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate or incomplete data</li>
            <li>Request deletion of your personal data</li>
            <li>Object to or restrict certain processing activities</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
          <p>
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@voeq.ng" className="info-link">privacy@voeq.ng</a>.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">8. Security</h2>
          <p>
            We implement reasonable technical and organizational measures to 
            protect your data from unauthorized access, loss, misuse, or 
            alteration. However, no method of transmission over the internet or 
            electronic storage is 100% secure.
          </p>
          <p>
            You are responsible for maintaining the confidentiality of your 
            account password and for any activity under your account.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">9. Cookies and Tracking</h2>
          <p>
            Voeq uses cookies and similar technologies to improve user experience, 
            analyze usage patterns, and remember your preferences. You can control 
            cookie settings through your browser, but disabling cookies may affect 
            platform functionality.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">10. Third-Party Links</h2>
          <p>
            The platform may contain links to third-party websites or services 
            (e.g., vendor social media profiles). We are not responsible for the 
            privacy practices of these third parties. We encourage you to review 
            their privacy policies.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">11. Children's Privacy</h2>
          <p>
            Voeq is intended for students and adults. We do not knowingly collect 
            personal information from children under 13. If you believe we have 
            collected information from a child under 13, please contact us 
            immediately.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">12. Changes to This Policy</h2>
          <p>
            This Privacy Policy may be updated as Voeq's features evolve, including 
            with the introduction of in-platform payments in a future phase. We will 
            update the "Last updated" date above and, for material changes, notify 
            you via email or prominent platform notice.
          </p>
          <p>
            Continued use of Voeq after changes constitutes acceptance of the 
            updated policy.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">13. Governing Law</h2>
          <p>
            This Privacy Policy is governed by the laws of the Federal Republic of 
            Nigeria, including the Nigeria Data Protection Regulation (NDPR).
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">14. Contact</h2>
          <p>
            Questions or concerns about this Privacy Policy:{' '}
            <a href="mailto:privacy@voeq.ng" className="info-link">privacy@voeq.ng</a>
          </p>
        </section>
      </div>
    </InfoPageShell>
  );
}
