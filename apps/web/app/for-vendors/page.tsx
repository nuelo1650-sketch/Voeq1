import Link from "next/link";
import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata = {
  title: "For Vendors",
  description: "Sell on Voeq. Reach students across campus.",
};

export default function ForVendorsPage() {
  return (
    <InfoPageShell title="For Vendors" subtitle="Reach students where they already shop.">
      <section>
        <h2>Why Sell on Voeq?</h2>
        <p>
          Reach thousands of students on your campus who are actively looking for
          what you sell. No setup fees, no complicated onboarding.
        </p>
        {/* PLACEHOLDER */}
      </section>
      <section>
        <h2>How It Works</h2>
        <p>
          List your items, set your availability, and start receiving messages
          from interested buyers.
        </p>
        {/* PLACEHOLDER */}
      </section>
      <section>
        <h2>Getting Started</h2>
        <p>
          Click &ldquo;Start Selling&rdquo; below to create your vendor account.
          You&rsquo;ll be live within 24 hours.
        </p>
        {/* PLACEHOLDER */}
        <Link href="/signup" data-testid="for-vendors-cta" className="landing-cta">
          Start Selling
          <span className="cta-arrow" aria-hidden="true">→</span>
        </Link>
      </section>
    </InfoPageShell>
  );
}
