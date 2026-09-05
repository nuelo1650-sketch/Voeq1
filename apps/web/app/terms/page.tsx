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
        <p className="info-date">Last updated: September 5, 2026</p>

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
            Voeq is a campus marketplace that connects students with vendors 
            operating on or near their campus. Voeq is a discovery and 
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
          <p>
            To keep listings trustworthy, we apply integrity rules to edits: a 
            listing that has received engagement (saves, comments, likes, 
            conversations) cannot be edited into a materially different product, 
            and its category is locked while it has engagement. When an edit 
            meaningfully changes a listing, the users who saved it are notified 
            with the details of the change.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">3. Connecting and Messaging</h2>
          <p>
            Voeq facilitates connection between students and vendors through 
            vendor profiles and in-app messaging. All arrangements — pricing, 
            delivery, quality, disputes — are made directly between the student 
            and the vendor.
          </p>
          <p>
            In-app messages must follow the conduct rules in Section 6. You can 
            report any message, listing, review, or comment for staff review. 
            As part of moderation, staff may review content that has been 
            reported to us.
          </p>
          <p>
            Voeq is not responsible for the outcome of any interaction, exchange, 
            or transaction that occurs as a result of a connection made through 
            the platform.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">4. User-Generated Content</h2>
          <p>
            You retain ownership of content you contribute to Voeq — profile 
            photos, listing photos, reviews, comments, and messages. By 
            uploading or posting content, you grant Voeq a non-exclusive, 
            worldwide, royalty-free license to host, cache, display, and 
            distribute that content within the platform's features (for 
            example, displaying your listing photos on your storefront, on 
            Explore, and in search).
          </p>
          <p>
            You confirm that you have the rights to any images you upload and 
            that photos you post of other people are posted with their 
            understanding. Content that violates these Terms or our content 
            rules may be removed without notice.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">5. Content Moderation</h2>
          <p>
            Every image uploaded to Voeq (profile and listing photos) is 
            automatically screened for nudity and prohibited content before it 
            can appear on the platform. Screening happens through a third-party 
            moderation service. If the screening service is unavailable, the 
            image is not published — nothing unscreened goes live.
          </p>
          <p>
            Automated screening is not perfect. If content that breaks our rules 
            slips through, report it — staff review reports and can remove 
            content, restrict accounts, and escalate enforcement.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">6. Prohibited Conduct</h2>
          <p>Users may not:</p>
          <ul className="info-list">
            <li>List fraudulent or fictitious vendors</li>
            <li>Misrepresent their campus affiliation or physical presence</li>
            <li>Use the platform for harassment, scams, or illegal activity</li>
            <li>List prohibited goods or services (as defined by Nigerian law)</li>
            <li>Scrape, copy, or misuse platform data without permission</li>
            <li>Impersonate another user or vendor</li>
            <li>Use messaging to spam, harass, or defraud other users</li>
            <li>Manipulate reviews, ratings, or engagement (fake reviews, 
            review swapping, engagement farming)</li>
            <li>Create new accounts to evade an enforcement action on a 
            previous account</li>
          </ul>
        </section>

        <section className="info-section">
          <h2 className="info-heading">7. No Payments on Platform</h2>
          <p>
            Voeq does not process payments. Any financial exchange between a 
            student and vendor happens entirely outside the platform, at the 
            parties' own risk.
          </p>
          <p>
            Should Voeq introduce payment processing in the future, separate 
            payment terms will apply.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">8. Enforcement and Appeals</h2>
          <p>
            Voeq may enforce these Terms through a graduated ladder: a warning, 
            a temporary suspension, or a permanent ban, depending on severity 
            and history. We may suspend or remove any listing or account that 
            violates these terms, misrepresents vendor presence, or is reported 
            as fraudulent. We reserve the right to investigate reports and take 
            action without prior notice.
          </p>
          <p>
            You can appeal any enforcement action through the appeal link 
            included in your enforcement notification email, or at voeq.ng/appeal. 
            Accounts removed for serious violations may be blocked from 
            registering again.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">9. Limitation of Liability</h2>
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
          <h2 className="info-heading">10. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Voeq, its officers, directors, 
            employees, and agents from any claims, damages, losses, liabilities, 
            and expenses (including legal fees) arising from your use of the 
            platform or violation of these terms.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">11. Changes to These Terms</h2>
          <p>
            These Terms are versioned. When we make changes — including material 
            ones — we publish a new version and update the "Last updated" date 
            above. At your next login after a new version is published, you will 
            be asked to review and accept the updated Terms before continuing to 
            use Voeq. The version you accepted, and when, is stored on your 
            account.
          </p>
          <p>
            Material changes will also be communicated through the platform or 
            via email if you have an account.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">12. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the Federal Republic of Nigeria. 
            Any disputes arising from these terms or your use of Voeq shall be 
            resolved in Nigerian courts.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">13. Contact</h2>
          <p>
            Questions about these Terms:{' '}
            <a href="mailto:legal@voeq.ng" className="info-link">legal@voeq.ng</a>
          </p>
        </section>
      </div>
    </InfoPageShell>
  );
}
