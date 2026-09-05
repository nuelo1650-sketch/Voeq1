import { redirect } from "next/navigation";
import { getStaffIdentity } from "@/lib/session";
import { mockCategoryRepo, mockCampusRepo, mockAgreementRepo, mockFeatureFlagRepo, ROLE_CAPABILITIES, type StaffRole } from "@voeq/data";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { ConfigConsole } from "@/components/admin/ConfigConsole";

export const dynamic = "force-dynamic";

/**
 * K3c.7 → Config Console (P2, 2026-09-05): the page WAS a stub — two dead
 * Edit buttons over a read-only list. It is now the profound control plane:
 * Categories / Campuses / Agreements / Feature Flags, each wired to its
 * real (config.write-gated) API. Server-fetched rows; all mutations go
 * through the client panels in ConfigConsole.
 */
export default async function ConfigPage() {
  const staff = await getStaffIdentity();
  if (!staff) redirect("/login?next=/staff/config");

  const caps = ROLE_CAPABILITIES[staff.staffRole as StaffRole];
  if (!caps.includes("config.write")) redirect("/staff");

  const [categories, campuses, agreements, flags] = await Promise.all([
    mockCategoryRepo.list(),
    mockCampusRepo.list(),
    mockAgreementRepo.list(),
    mockFeatureFlagRepo.list(),
  ]);

  return (
    <AppShell role="staff" userName={staff.email}>
      <div className="staff-page" style={{ minHeight: "100vh", background: "var(--role-surface-sunken)", padding: "var(--space-4)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Link href="/staff" style={{ fontSize: 14, color: "var(--role-accent)", textDecoration: "none", marginBottom: 12, display: "inline-block" }}>
            ← Back to dashboard
          </Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: 0, color: "var(--role-text)", fontWeight: 700 }}>
            Configuration
          </h1>
          <p style={{ margin: "4px 0 24px", fontSize: 14, color: "var(--role-text-muted)" }}>
            Platform configuration — categories, campuses, legal agreements, feature flags. Every action is recorded in the audit log.
          </p>
          <ConfigConsole
            initialCategories={JSON.parse(JSON.stringify(categories))}
            initialCampuses={JSON.parse(JSON.stringify(campuses.map((c) => ({ id: c.id, slug: c.slug, name: c.name, city: c.city, state: c.state, status: c.status }))))}
            initialAgreements={JSON.parse(JSON.stringify(agreements.map((a) => ({ id: a.id, kind: a.kind, version: a.version, body: a.body, effectiveAt: a.effectiveAt, isCurrent: a.isCurrent }))))}
            initialFlags={JSON.parse(JSON.stringify(flags))}
          />
        </div>
      </div>
    </AppShell>
  );
}
