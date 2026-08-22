import { redirect } from "next/navigation";
import { getStaffIdentity } from "@/lib/session";
import { mockCategoryRepo, mockCampusRepo, mockAgreementRepo, mockFeatureFlagRepo } from "@voeq/data";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const staff = await getStaffIdentity();
  if (!staff) redirect("/login?next=/staff/config");

  const [categories, campuses, agreements, flags] = await Promise.all([
    mockCategoryRepo.list(),
    mockCampusRepo.list(),
    mockAgreementRepo.list(),
    mockFeatureFlagRepo.list(),
  ]);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 16, fontFamily: "var(--role-font-ui)" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h2)" }}>Configuration</h1>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: "var(--fs-h3)" }}>Categories</h2>
        <ul data-testid="category-list">
          {categories.map((c) => (
            <li key={c.slug}>{c.name} <code>{c.slug}</code></li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: "var(--fs-h3)" }}>Campuses</h2>
        <ul data-testid="campus-list">
          {campuses.map((c) => (
            <li key={c.id}>{c.name} <code>{c.id}</code> — {c.status}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: "var(--fs-h3)" }}>Agreements</h2>
        <ul data-testid="agreement-list">
          {agreements.map((a) => (
            <li key={a.id}>{a.kind} v{a.version} — {a.isCurrent ? "current" : "archived"}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: "var(--fs-h3)" }}>Feature flags</h2>
        <ul data-testid="flag-list">
          {flags.map((f) => (
            <li key={f.key}>{f.description} — <strong>{f.value ? "on" : "off"}</strong></li>
          ))}
        </ul>
      </section>
    </main>
  );
}
