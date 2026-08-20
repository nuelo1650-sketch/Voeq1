import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of service for the Voeq campus marketplace.",
};

export default function TermsPage() {
  return (
    <InfoPageShell title="Terms of Service">
      <p className="legal-updated">Last updated: [date]</p>

      <section>
        <p>
          Welcome to Voeq. By accessing or using voeq.ng (&ldquo;Voeq,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us&rdquo;), you agree to these Terms of
          Service. If you don&rsquo;t agree, please don&rsquo;t use the platform.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>1. What Voeq Is</h2>
        <p>
          Voeq is a campus marketplace directory that connects students with
          vendors operating on or near their campus. Voeq is a discovery and
          connection platform. We do not process payments, hold funds in escrow,
          or act as a party to any transaction between a student and a vendor.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>2. Vendor Listings</h2>
        <p>
          Vendors list their business for free. When creating a listing, vendors
          confirm they are presently operating on the campus they select. This
          confirmation is self-reported by the vendor at the time of listing; Voeq
          does not independently verify a vendor&rsquo;s physical presence,
          identity, or the accuracy of their listing content. Users should
          exercise their own judgment when engaging with any vendor.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>3. Connecting with Vendors</h2>
        <p>
          Voeq facilitates connection between students and vendors through the
          platform&rsquo;s messaging feature. All arrangements — pricing,
          delivery, quality, disputes — are made directly between the student
          and the vendor. Voeq is not responsible for the outcome of any
          interaction, exchange, or transaction that occurs as a result of a
          connection made through the platform.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>4. Prohibited Conduct</h2>
        <p>
          Users may not: list fraudulent or fictitious vendors; misrepresent
          their campus affiliation or presence; use the platform for harassment,
          scams, or illegal activity; or list prohibited goods or services.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>5. No Transactions on Platform</h2>
        <p>
          As of this version, Voeq does not process payments. Any financial
          exchange between a student and vendor happens entirely outside the
          platform, at the parties&rsquo; own risk.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>6. Account Suspension</h2>
        <p>
          Voeq may suspend or remove any listing or account that violates these
          terms, misrepresents vendor presence, or is reported as fraudulent.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>7. Limitation of Liability</h2>
        <p>
          Voeq provides the platform &ldquo;as is.&rdquo; We are not liable for
          any loss, damage, or dispute arising from interactions between users,
          including but not limited to fraud, misrepresentation, or failed
          transactions conducted off-platform.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>8. Changes to These Terms</h2>
        <p>
          We may update these Terms as Voeq&rsquo;s features evolve, including if
          and when in-platform payments are introduced. Continued use of Voeq
          after changes constitutes acceptance.
        </p>
        {/* PLACEHOLDER */}
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>
          Questions about these Terms: support@voeq.ng
        </p>
        {/* PLACEHOLDER */}
      </section>
    </InfoPageShell>
  );
}
