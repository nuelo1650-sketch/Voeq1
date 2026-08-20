import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata = {
  title: "Help",
  description: "Frequently asked questions about using Voeq.",
};

export default function HelpPage() {
  return (
    <InfoPageShell title="Help">
      <section>
        <h2>Discovery</h2>
        <dl>
          <dt>How do I find listings near my campus?</dt>
          <dd>
            Open the Explore page and select your campus. Listings are sorted by
            what&rsquo;s open now and closest to you.
            {/* PLACEHOLDER */}
          </dd>
          <dt>Can I filter by category?</dt>
          <dd>
            Yes. Use the category chips at the top of the Explore page to narrow
            down your search.
            {/* PLACEHOLDER */}
          </dd>
        </dl>
      </section>
      <section>
        <h2>Messaging</h2>
        <dl>
          <dt>How do I message a seller?</dt>
          <dd>
            Tap &ldquo;Message vendor&rdquo; on any listing. You&rsquo;ll be able
            to chat directly without sharing your phone number.
            {/* PLACEHOLDER */}
          </dd>
          <dt>Is my conversation private?</dt>
          <dd>
            Yes. All messaging between students and vendors is free and stays
            between you and the vendor.
            {/* PLACEHOLDER */}
          </dd>
        </dl>
      </section>
      <section>
        <h2>Accounts</h2>
        <dl>
          <dt>How do I create an account?</dt>
          <dd>
            Tap &ldquo;Sign up&rdquo; and verify your student email. You&rsquo;ll
            be browsing in under a minute.
            {/* PLACEHOLDER */}
          </dd>
          <dt>How do I verify my student status?</dt>
          <dd>
            Use your university email at sign-up. A verified student address unlocks
            buying and selling on your campus.
            {/* PLACEHOLDER */}
          </dd>
        </dl>
      </section>
    </InfoPageShell>
  );
}
