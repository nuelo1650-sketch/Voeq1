/* eslint-disable react/no-unescaped-entities */
import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata = {
  title: "Privacy Policy",
  description: "How Voeq collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <InfoPageShell title="Privacy Policy">
      <div className="info-page-content">
        <p className="info-date">Last updated: September 5, 2026</p>

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
              affiliation, and password (for students and vendors who create 
              accounts). If you sign up with Google, we receive your name, 
              email address, and Google account identifier.
            </li>
            <li>
              <strong>Vendor listing details:</strong> Business name, category, 
              description, campus location, hours, social links, and listing 
              content
            </li>
            <li>
              <strong>Photos:</strong> Profile photos and listing photos you 
              upload
            </li>
            <li>
              <strong>Usage data:</strong> Pages visited, listings viewed, search 
              queries, and basic technical information such as IP address 
              (stored in hashed form for security logs) and browser type
            </li>
            <li>
              <strong>Messages:</strong> Messages you send through in-app 
              messaging
            </li>
            <li>
              <strong>Engagement:</strong> Likes, saves, follows, reviews, and 
              comments you create
            </li>
          </ul>
        </section>

        <section className="info-section">
          <h2 className="info-heading">2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="info-list">
            <li>Create and manage your account</li>
            <li>Display vendor listings to students on the relevant campus</li>
            <li>Facilitate connection and messaging between students and vendors</li>
            <li>Improve the platform and understand usage patterns</li>
            <li>Communicate updates via email or through community channels 
            if you choose to join</li>
            <li>Prevent fraud, abuse, and violations of our Terms of Service</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="info-section">
          <h2 className="info-heading">3. Photos: Storage and Moderation</h2>
          <p>
            Photos you upload (profile and listing photos) are stored on 
            Cloudinary, our third-party media hosting provider, and delivered 
            from there to the app. Every uploaded photo is automatically 
            screened by Sightengine, a third-party content moderation service, 
            before it can appear publicly. This screening exists to keep 
            prohibited imagery (for example, nudity) off the platform.
          </p>
          <p>
            For the purpose of this screening, the photo is processed by 
            Sightengine at upload time. Voeq staff do not review your photos 
            unless they are reported by other users.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">4. Messages and Moderation</h2>
          <p>
            Messages you send through in-app messaging are stored so that you 
            and your conversation partner can see your conversation, and so 
            that reported messages can be reviewed by staff. A conversation 
            is only visible to its participants, plus staff reviewing reports 
            about it. Messages can be reported, but not edited after sending.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">5. What We Don't Collect</h2>
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
          <h2 className="info-heading">6. Sharing of Information</h2>
          <p>
            <strong>We do not sell your personal data.</strong> We may share 
            information in the following circumstances:
          </p>
          <ul className="info-list">
            <li>
              <strong>Public listings:</strong> Vendor storefront content, 
              listing photos, and the contact routes vendors choose to display 
              are public so students can reach them
            </li>
            <li>
              <strong>Service providers:</strong> We share limited data with 
              third-party service providers who help operate the platform — 
              hosting and database (Vercel, Neon, Render), media hosting and 
              moderation (Cloudinary, Sightengine), email delivery (Resend), 
              bot prevention (Cloudflare Turnstile), and sign-in (Google) — 
              bound by confidentiality obligations
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
          <h2 className="info-heading">7. Vendor Presence Disclaimer</h2>
          <p>
            Vendor claims about their campus presence, business details, and 
            contact information are self-reported and not independently verified 
            by Voeq. This Privacy Policy does not constitute a guarantee of any 
            vendor's identity, legitimacy, or accuracy of information provided.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">8. Security and Access</h2>
          <p>
            We implement reasonable technical and organizational measures to 
            protect your data from unauthorized access, loss, misuse, or 
            alteration. Passwords are stored only as cryptographic hashes. 
            Sessions are protected with secure, httpOnly cookies. Access to 
            staff tools is restricted by role, and every sensitive staff 
            action is logged in an internal audit trail. However, no method of 
            transmission over the internet or electronic storage is 100% secure.
          </p>
          <p>
            We record security-related events — such as logins and enforcement 
            actions — for fraud prevention. These records are restricted to 
            staff with the appropriate role.
          </p>
          <p>
            You are responsible for maintaining the confidentiality of your 
            account password and for any activity under your account.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">9. Data Retention</h2>
          <p>
            We retain account and listing data for as long as your account is 
            active. If your account is suspended or banned, we retain the 
            information needed to enforce that decision and to handle your 
            appeal. After account deletion, we retain certain data for a 
            reasonable period for legal, operational, and fraud prevention 
            purposes. Security records are retained for up to 12 months.
          </p>
          <p>
            Anonymized usage data may be retained indefinitely for analytics and 
            platform improvement.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">10. Your Rights</h2>
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
            You can also export your data from Settings, or delete your account 
            from Settings at any time.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">11. Cookies and Tracking</h2>
          <p>
            Voeq uses cookies and similar technologies to keep you signed in, 
            remember your preferences, and understand usage patterns. We use 
            Cloudflare Turnstile to distinguish humans from bots on sign-up 
            and login. You can control cookie settings through your browser, 
            but disabling cookies may affect platform functionality.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">12. Third-Party Links</h2>
          <p>
            The platform may contain links to third-party websites or services 
            (e.g., vendor social media profiles, WhatsApp channels). We are not 
            responsible for the privacy practices of these third parties. We 
            encourage you to review their privacy policies.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">13. Children's Privacy</h2>
          <p>
            Voeq is intended for students and adults. We do not knowingly collect 
            personal information from children under 13. If you believe we have 
            collected personal information from a child under 13, please contact 
            us immediately.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">14. Changes to This Policy</h2>
          <p>
            This Privacy Policy is versioned. When we make changes — including 
            material ones — we publish a new version and update the "Last 
            updated" date above. At your next login after a new version is 
            published, you will be asked to review and accept the updated 
            policy before continuing to use Voeq. The version you accepted, 
            and when, is stored on your account.
          </p>
          <p>
            Continued use of Voeq after changes constitutes acceptance of the 
            updated policy.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">15. Governing Law</h2>
          <p>
            This Privacy Policy is governed by the laws of the Federal Republic of 
            Nigeria, including the Nigeria Data Protection Regulation (NDPR).
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">16. Contact</h2>
          <p>
            Questions or concerns about this Privacy Policy:{' '}
            <a href="mailto:privacy@voeq.ng" className="info-link">privacy@voeq.ng</a>
          </p>
        </section>
      </div>
    </InfoPageShell>
  );
}
