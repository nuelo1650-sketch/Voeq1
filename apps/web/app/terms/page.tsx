/* eslint-disable react/no-unescaped-entities */
import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of service for the Voeq campus marketplace.",
};

export default function TermsPage() {
  return (
    <InfoPageShell title="Terms of Service">
      <div className="info-page-content">
        <p className="info-date">Last updated: August 21, 2026</p>

        <section className="info-section">
          <p>
            Welcome to Voeq. By accessing or using voeq.ng ("Voeq," "we," "us"), 
            you agree to these Terms of Service. If you don't agree, please don't 
            use the platform.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">1. What Voeq Is</h2>
          <p>
            Voeq is a campus marketplace directory that connects students with 
            vendors operating on or near their campus. Voeq is a discovery and 
            connection platform. We do not process payments, hold funds in escrow, 
            or act as a party to any transaction between a student and a vendor.
          </p>
          <p>
            All transactions, agreements, and exchanges happen directly between 
            users. Voeq provides the introduction — nothing more.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">2. Vendor Listings</h2>
          <p>
            Vendors list their business for free. When creating a listing, vendors 
            confirm they are presently operating on the campus they select. This 
            confirmation is self-reported by the vendor at the time of listing.
          </p>
          <p>
            Voeq does not independently verify a vendor's physical presence, 
            identity, or the accuracy of their listing content. Users should 
            exercise their own judgment when engaging with any vendor.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">3. Connecting with Vendors</h2>
          <p>
            Voeq facilitates connection between students and vendors through 
            contact information displayed on vendor profiles. All arrangements — 
            pricing, delivery, quality, disputes — are made directly between the 
            student and the vendor.
          </p>
          <p>
            Voeq is not responsible for the outcome of any interaction, exchange, 
            or transaction that occurs as a result of a connection made through 
            the platform.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">4. Prohibited Conduct</h2>
          <p>Users may not:</p>
          <ul className="info-list">
            <li>List fraudulent or fictitious vendors</li>
            <li>Misrepresent their campus affiliation or physical presence</li>
            <li>Use the platform for harassment, scams, or illegal activity</li>
            <li>List prohibited goods or services (as defined by Nigerian law)</li>
            <li>Scrape, copy, or misuse platform data without permission</li>
            <li>Impersonate another user or vendor</li>
          </ul>
        </section>

        <section className="info-section">
          <h2 className="info-heading">5. No Transactions on Platform</h2>
          <p>
            As of this version, Voeq does not process payments. Any financial 
            exchange between a student and vendor happens entirely outside the 
            platform, at the parties' own risk.
          </p>
          <p>
            Should Voeq introduce payment processing in the future, separate 
            payment terms will apply.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">6. Account Suspension and Removal</h2>
          <p>
            Voeq may suspend or remove any listing or account that violates these 
            terms, misrepresents vendor presence, or is reported as fraudulent. 
            We reserve the right to investigate reports and take action without 
            prior notice.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">7. Limitation of Liability</h2>
          <p>
            Voeq provides the platform "as is." We are not liable for any loss, 
            damage, or dispute arising from interactions between users, including 
            but not limited to fraud, misrepresentation, failed transactions, 
            property damage, personal injury, or any other harm resulting from 
            connections made through the platform.
          </p>
          <p>
            To the maximum extent permitted by law, Voeq disclaims all warranties, 
            express or implied, including merchantability and fitness for a 
            particular purpose.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">8. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Voeq, its officers, directors, 
            employees, and agents from any claims, damages, losses, liabilities, 
            and expenses (including legal fees) arising from your use of the 
            platform or violation of these terms.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">9. Changes to These Terms</h2>
          <p>
            We may update these Terms as Voeq's features evolve, including if and 
            when in-platform payments are introduced. Continued use of Voeq after 
            changes constitutes acceptance of the updated terms.
          </p>
          <p>
            Material changes will be communicated through the platform or via email 
            if you have an account.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">10. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the Federal Republic of Nigeria. 
            Any disputes arising from these terms or your use of Voeq shall be 
            resolved in Nigerian courts.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">11. Contact</h2>
          <p>
            Questions about these Terms:{' '}
            <a href="mailto:legal@voeq.ng" className="info-link">legal@voeq.ng</a>
          </p>
        </section>
      </div>
    </InfoPageShell>
  );
}
