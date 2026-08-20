import type { Metadata } from "next";
import { InfoPageShell } from "@/components/info/InfoPageShell";
import { StaffContactForm, type StaffField } from "@/components/forms/StaffContactForm";

export const metadata: Metadata = {
  title: "Press — Voeq",
  description: "News, updates, and media resources for Voeq.",
};

const PRESS_FIELDS: StaffField[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "publication", label: "Publication", type: "text", required: true },
  { name: "message", label: "Message", type: "textarea", required: true },
];

export default function PressPage() {
  return (
    <InfoPageShell title="Press">
      <section data-testid="press-releases">
        <h2>Press Releases</h2>
        <article>
          <h3>Voeq launches the campus marketplace</h3>
          <p className="press-date">2026-08-01</p>
          <p>
            Voeq officially launches across Nigerian universities, connecting
            students with campus vendors for the first time. The platform is now
            live at select campuses with plans for nationwide expansion.
            {/* PLACEHOLDER */}
          </p>
        </article>
        <article>
          <h3>Voeq expands to more campuses</h3>
          <p className="press-date">2026-08-15</p>
          <p>
            Campus vendors on Voeq have collectively served over 10,000 students in
            the first month. The marketplace continues to grow as more universities
            come online.
            {/* PLACEHOLDER */}
          </p>
        </article>
      </section>

      <section data-testid="press-media-kit">
        <h2>Media Kit</h2>
        <p>
          Logo, brand assets, and founder photos are available on request. {/* PLACEHOLDER */}
        </p>
      </section>

      <section data-testid="press-contact">
        <h2>Contact</h2>
        <StaffContactForm kind="press" fields={PRESS_FIELDS} />
      </section>
    </InfoPageShell>
  );
}
