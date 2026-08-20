import type { Metadata } from "next";
import { InfoPageShell } from "@/components/info/InfoPageShell";
import { StaffContactForm, type StaffField } from "@/components/forms/StaffContactForm";

export const metadata: Metadata = {
  title: "Careers — Voeq",
  description: "Join the team building the future of campus commerce.",
};

const ROLES = [
  { title: "Frontend Engineer", description: "Build the campus marketplace.", location: "Nigeria" },
  { title: "Community Manager", description: "Grow the vendor network.", location: "Nigeria" },
];

const CAREERS_FIELDS: StaffField[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "role", label: "Role", type: "select", required: true, options: ROLES.map((r) => r.title) },
  { name: "resumeLink", label: "Resume Link", type: "text", required: true },
  { name: "coverLetter", label: "Cover Letter", type: "textarea", required: true },
];

export default function CareersPage() {
  return (
    <InfoPageShell title="Careers">
      <section data-testid="careers-why">
        <h2>Why Voeq</h2>
        <p>
          We are building the commerce layer for African campuses — tools that let student vendors
          reach their peers without the noise of global marketplaces. {/* PLACEHOLDER */}
        </p>
      </section>

      <section data-testid="careers-roles">
        <h2>Open Roles</h2>
        {ROLES.map((r) => (
          <article key={r.title} className="careers-role" data-testid="careers-role">
            <h3>{r.title}</h3>
            <p>{r.description}</p>
            <p className="careers-location">{r.location}</p>
          </article>
        ))}
      </section>

      <section data-testid="careers-apply">
        <h2>Apply</h2>
        <StaffContactForm kind="careers" fields={CAREERS_FIELDS} />
      </section>
    </InfoPageShell>
  );
}
